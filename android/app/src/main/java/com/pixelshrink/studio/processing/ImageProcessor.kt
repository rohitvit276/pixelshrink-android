package com.pixelshrink.studio.processing

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Matrix
import android.graphics.Paint
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import com.google.android.gms.tasks.Task
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.Segmentation
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * All image tools run fully on-device — no network required.
 */
object ImageProcessor {

    // Cap the working resolution so large camera photos don't exhaust memory.
    private const val MAX_DIMENSION = 2048

    sealed class ToolResult {
        data class Success(
            val bytes: ByteArray,
            val info: Map<String, String> = emptyMap(),
        ) : ToolResult()

        data class Error(val message: String) : ToolResult()
    }

    // ── Decoding helpers ─────────────────────────────────────────────────────

    fun readBytes(context: Context, uri: Uri): ByteArray? = try {
        context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
    } catch (e: Exception) {
        null
    }

    /** Decode a content URI into an EXIF-upright bitmap no larger than [maxDim] on its longest side. */
    fun decodeOriented(context: Context, uri: Uri, maxDim: Int = MAX_DIMENSION): Bitmap? {
        return try {
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            context.contentResolver.openInputStream(uri)?.use {
                BitmapFactory.decodeStream(it, null, bounds)
            } ?: return null
            if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null

            var sample = 1
            while (maxOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= maxDim) sample *= 2
            val opts = BitmapFactory.Options().apply { inSampleSize = sample }
            val decoded = context.contentResolver.openInputStream(uri)?.use {
                BitmapFactory.decodeStream(it, null, opts)
            } ?: return null

            val rotation = try {
                context.contentResolver.openInputStream(uri)?.use { stream ->
                    when (ExifInterface(stream).getAttributeInt(
                        ExifInterface.TAG_ORIENTATION,
                        ExifInterface.ORIENTATION_NORMAL
                    )) {
                        ExifInterface.ORIENTATION_ROTATE_90 -> 90f
                        ExifInterface.ORIENTATION_ROTATE_180 -> 180f
                        ExifInterface.ORIENTATION_ROTATE_270 -> 270f
                        else -> 0f
                    }
                } ?: 0f
            } catch (e: Exception) {
                0f
            }

            val upright = if (rotation != 0f) {
                val m = Matrix().apply { postRotate(rotation) }
                Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, m, true)
            } else {
                decoded
            }
            scaleDown(upright, maxDim)
        } catch (e: Exception) {
            null
        }
    }

    private fun scaleDown(bmp: Bitmap, maxDim: Int): Bitmap {
        val longest = maxOf(bmp.width, bmp.height)
        if (longest <= maxDim) return bmp
        val scale = maxDim.toFloat() / longest
        return Bitmap.createScaledBitmap(
            bmp,
            (bmp.width * scale).toInt().coerceAtLeast(1),
            (bmp.height * scale).toInt().coerceAtLeast(1),
            true
        )
    }

    private fun toJpeg(bmp: Bitmap, quality: Int = 92): ByteArray =
        ByteArrayOutputStream().also { bmp.compress(Bitmap.CompressFormat.JPEG, quality, it) }
            .toByteArray()

    private fun toPng(bmp: Bitmap): ByteArray =
        ByteArrayOutputStream().also { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
            .toByteArray()

    // ── 1. Shrink ────────────────────────────────────────────────────────────

    suspend fun shrinkImage(
        context: Context,
        uri: Uri,
        quality: Int = 75,
        maxWidth: Int = 1920,
    ): ToolResult = withContext(Dispatchers.Default) {
        try {
            val originalSize = readBytes(context, uri)?.size
                ?: return@withContext ToolResult.Error("Could not read image")
            var bmp = decodeOriented(context, uri, maxDim = MAX_DIMENSION)
                ?: return@withContext ToolResult.Error("Could not decode image")
            if (bmp.width > maxWidth) {
                val scale = maxWidth.toFloat() / bmp.width
                bmp = Bitmap.createScaledBitmap(
                    bmp, maxWidth, (bmp.height * scale).toInt().coerceAtLeast(1), true
                )
            }
            val out = toJpeg(bmp, quality.coerceIn(1, 100))
            ToolResult.Success(
                out,
                mapOf(
                    "X-Original-Size" to (originalSize / 1024).toString(),
                    "X-Compressed-Size" to (out.size / 1024).toString(),
                )
            )
        } catch (e: Exception) {
            ToolResult.Error("Shrink failed: ${e.message}")
        } catch (e: OutOfMemoryError) {
            ToolResult.Error("Image is too large to process on this device")
        }
    }

    // ── 2. Center crop to aspect ratio ───────────────────────────────────────

    suspend fun cropToRatio(
        context: Context,
        uri: Uri,
        ratioW: Float,
        ratioH: Float,
    ): ToolResult = withContext(Dispatchers.Default) {
        try {
            val bmp = decodeOriented(context, uri)
                ?: return@withContext ToolResult.Error("Could not decode image")
            val targetRatio = ratioW / ratioH
            val imageRatio = bmp.width.toFloat() / bmp.height

            val (cropW, cropH) = if (imageRatio > targetRatio) {
                (bmp.height * targetRatio).toInt().coerceAtLeast(1) to bmp.height
            } else {
                bmp.width to (bmp.width / targetRatio).toInt().coerceAtLeast(1)
            }
            val x = (bmp.width - cropW) / 2
            val y = (bmp.height - cropH) / 2
            val cropped = Bitmap.createBitmap(bmp, x, y, cropW, cropH)
            ToolResult.Success(toJpeg(cropped))
        } catch (e: Exception) {
            ToolResult.Error("Crop failed: ${e.message}")
        }
    }

    // ── 3. Filters ───────────────────────────────────────────────────────────

    suspend fun applyFilter(
        context: Context,
        uri: Uri,
        filter: String,
        intensity: Float = 1.0f,
    ): ToolResult = withContext(Dispatchers.Default) {
        try {
            val bmp = decodeOriented(context, uri)
                ?: return@withContext ToolResult.Error("Could not decode image")
            val result = when (filter) {
                "grayscale" -> colorMatrix(bmp, ColorMatrix().apply { setSaturation(0f) })
                "sepia" -> colorMatrix(bmp, sepiaMatrix())
                "vintage" -> colorMatrix(bmp, vintageMatrix())
                "invert" -> colorMatrix(
                    bmp,
                    ColorMatrix(
                        floatArrayOf(
                            -1f, 0f, 0f, 0f, 255f,
                            0f, -1f, 0f, 0f, 255f,
                            0f, 0f, -1f, 0f, 255f,
                            0f, 0f, 0f, 1f, 0f,
                        )
                    )
                )
                "brightness" -> colorMatrix(
                    bmp,
                    ColorMatrix().apply { setScale(intensity, intensity, intensity, 1f) }
                )
                "contrast" -> colorMatrix(bmp, contrastMatrix(intensity))
                "blur" -> boxBlur(bmp, radius = 12)
                "sharpen" -> sharpen(bmp, amount = 1f)
                else -> return@withContext ToolResult.Error("Unknown filter: $filter")
            }
            ToolResult.Success(toJpeg(result))
        } catch (e: Exception) {
            ToolResult.Error("Filter failed: ${e.message}")
        }
    }

    private fun colorMatrix(src: Bitmap, cm: ColorMatrix): Bitmap {
        val out = Bitmap.createBitmap(src.width, src.height, Bitmap.Config.ARGB_8888)
        val paint = Paint().apply { colorFilter = ColorMatrixColorFilter(cm) }
        Canvas(out).drawBitmap(src, 0f, 0f, paint)
        return out
    }

    private fun sepiaMatrix() = ColorMatrix(
        floatArrayOf(
            0.393f, 0.769f, 0.189f, 0f, 0f,
            0.349f, 0.686f, 0.168f, 0f, 0f,
            0.272f, 0.534f, 0.131f, 0f, 0f,
            0f, 0f, 0f, 1f, 0f,
        )
    )

    private fun vintageMatrix() = sepiaMatrix().apply {
        // Soften contrast and lift shadows slightly for a faded-photo look.
        postConcat(contrastMatrix(0.85f))
    }

    private fun contrastMatrix(contrast: Float): ColorMatrix {
        val t = (1f - contrast) * 128f
        return ColorMatrix(
            floatArrayOf(
                contrast, 0f, 0f, 0f, t,
                0f, contrast, 0f, 0f, t,
                0f, 0f, contrast, 0f, t,
                0f, 0f, 0f, 1f, 0f,
            )
        )
    }

    /** Separable box blur — two running-sum passes, O(pixels) per pass. */
    private fun boxBlur(src: Bitmap, radius: Int): Bitmap {
        val w = src.width
        val h = src.height
        val inPx = IntArray(w * h)
        src.getPixels(inPx, 0, w, 0, 0, w, h)
        val tmp = IntArray(w * h)
        blurPass(inPx, tmp, w, h, radius, horizontal = true)
        blurPass(tmp, inPx, w, h, radius, horizontal = false)
        return Bitmap.createBitmap(inPx, w, h, Bitmap.Config.ARGB_8888)
    }

    private fun blurPass(src: IntArray, dst: IntArray, w: Int, h: Int, radius: Int, horizontal: Boolean) {
        val lineCount = if (horizontal) h else w
        val lineLen = if (horizontal) w else h
        val count = radius * 2 + 1
        for (line in 0 until lineCount) {
            fun pixel(i: Int): Int {
                val clamped = i.coerceIn(0, lineLen - 1)
                return if (horizontal) src[line * w + clamped] else src[clamped * w + line]
            }

            var sumR = 0
            var sumG = 0
            var sumB = 0
            for (i in -radius..radius) {
                val p = pixel(i)
                sumR += (p shr 16) and 0xFF
                sumG += (p shr 8) and 0xFF
                sumB += p and 0xFF
            }
            for (i in 0 until lineLen) {
                val v = (0xFF shl 24) or
                    ((sumR / count) shl 16) or
                    ((sumG / count) shl 8) or
                    (sumB / count)
                if (horizontal) dst[line * w + i] = v else dst[i * w + line] = v
                val add = pixel(i + radius + 1)
                val sub = pixel(i - radius)
                sumR += ((add shr 16) and 0xFF) - ((sub shr 16) and 0xFF)
                sumG += ((add shr 8) and 0xFF) - ((sub shr 8) and 0xFF)
                sumB += (add and 0xFF) - (sub and 0xFF)
            }
        }
    }

    /** Unsharp-style 3x3 kernel: center 1+4a, cross neighbors -a. */
    private fun sharpen(src: Bitmap, amount: Float): Bitmap {
        val w = src.width
        val h = src.height
        val inPx = IntArray(w * h)
        src.getPixels(inPx, 0, w, 0, 0, w, h)
        val outPx = IntArray(w * h)
        val center = 1f + 4f * amount

        for (y in 0 until h) {
            val up = (y - 1).coerceAtLeast(0) * w
            val row = y * w
            val down = (y + 1).coerceAtMost(h - 1) * w
            for (x in 0 until w) {
                val left = (x - 1).coerceAtLeast(0)
                val right = (x + 1).coerceAtMost(w - 1)
                val c = inPx[row + x]
                val n = inPx[up + x]
                val s = inPx[down + x]
                val e = inPx[row + right]
                val wp = inPx[row + left]

                fun channel(shift: Int): Int {
                    val v = ((c shr shift) and 0xFF) * center -
                        (((n shr shift) and 0xFF) + ((s shr shift) and 0xFF) +
                            ((e shr shift) and 0xFF) + ((wp shr shift) and 0xFF)) * amount
                    return v.toInt().coerceIn(0, 255)
                }

                outPx[row + x] = (0xFF shl 24) or
                    (channel(16) shl 16) or (channel(8) shl 8) or channel(0)
            }
        }
        return Bitmap.createBitmap(outPx, w, h, Bitmap.Config.ARGB_8888)
    }

    // ── 4. Remove background (ML Kit selfie segmentation, on-device) ────────

    suspend fun removeBackground(context: Context, uri: Uri): ToolResult =
        withContext(Dispatchers.Default) {
            try {
                val bmp = decodeOriented(context, uri)
                    ?.copy(Bitmap.Config.ARGB_8888, false)
                    ?: return@withContext ToolResult.Error("Could not decode image")

                val segmenter = Segmentation.getClient(
                    SelfieSegmenterOptions.Builder()
                        .setDetectorMode(SelfieSegmenterOptions.SINGLE_IMAGE_MODE)
                        .build()
                )
                val mask = try {
                    segmenter.process(InputImage.fromBitmap(bmp, 0)).awaitResult()
                } finally {
                    segmenter.close()
                }

                val w = bmp.width
                val h = bmp.height
                val mw = mask.width
                val mh = mask.height
                val confidences = mask.buffer.asFloatBuffer()
                val pixels = IntArray(w * h)
                bmp.getPixels(pixels, 0, w, 0, 0, w, h)

                var maxConfidence = 0f
                for (y in 0 until h) {
                    val my = (y.toLong() * mh / h).toInt().coerceAtMost(mh - 1)
                    for (x in 0 until w) {
                        val mx = (x.toLong() * mw / w).toInt().coerceAtMost(mw - 1)
                        val confidence = confidences.get(my * mw + mx)
                        if (confidence > maxConfidence) maxConfidence = confidence
                        val alpha = (confidence * 255f).toInt().coerceIn(0, 255)
                        pixels[y * w + x] = (alpha shl 24) or (pixels[y * w + x] and 0xFFFFFF)
                    }
                }

                if (maxConfidence < 0.5f) {
                    return@withContext ToolResult.Error(
                        "No person detected. This tool works best on photos of people."
                    )
                }

                val out = Bitmap.createBitmap(pixels, w, h, Bitmap.Config.ARGB_8888)
                ToolResult.Success(toPng(out))
            } catch (e: Exception) {
                ToolResult.Error("Background removal failed: ${e.message}")
            }
        }

    private suspend fun <T> Task<T>.awaitResult(): T =
        suspendCancellableCoroutine { cont ->
            addOnSuccessListener { cont.resume(it) }
            addOnFailureListener { cont.resumeWithException(it) }
        }
}
