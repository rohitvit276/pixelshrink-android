package com.pixelshrink.studio.network

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.InputStream
import java.util.concurrent.TimeUnit

/**
 * Single source of truth for all backend API calls.
 * Base URL points to the Vercel-hosted FastAPI backend.
 */
object PixelShrinkApi {

    // ── Change this if you redeploy to a custom domain ──────────────────────
    private const val BASE_URL =
        "https://pixelshrink-studio-lim2-k65zohwvd-rohitvit276s-projects.vercel.app"

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)   // image processing can take a few seconds
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    // ── Result wrapper ───────────────────────────────────────────────────────
    sealed class ApiResult {
        data class Success(val bytes: ByteArray, val headers: Map<String, String?> = emptyMap()) : ApiResult()
        data class Error(val message: String) : ApiResult()
    }

    // ── Shared helper: read URI → ByteArray ─────────────────────────────────
    fun readBytes(context: Context, uri: Uri): ByteArray? {
        return try {
            context.contentResolver.openInputStream(uri)?.use(InputStream::readBytes)
        } catch (e: Exception) {
            null
        }
    }

    private fun mimeType(context: Context, uri: Uri): String {
        return context.contentResolver.getType(uri) ?: "image/jpeg"
    }

    // ── POST multipart image to a given endpoint ─────────────────────────────
    private suspend fun postImage(
        endpoint: String,
        imageBytes: ByteArray,
        mimeType: String,
        extraParams: Map<String, String> = emptyMap(),
    ): ApiResult = withContext(Dispatchers.IO) {
        try {
            val bodyBuilder = MultipartBody.Builder().setType(MultipartBody.FORM)
            bodyBuilder.addFormDataPart(
                "file", "upload.jpg",
                imageBytes.toRequestBody(mimeType.toMediaType())
            )
            extraParams.forEach { (k, v) -> bodyBuilder.addFormDataPart(k, v) }

            val url = StringBuilder("$BASE_URL$endpoint")
            // For GET-style query params on POST endpoints
            if (extraParams.isNotEmpty() && endpoint.contains("crop") || endpoint.contains("filter")) {
                url.append("?")
                url.append(extraParams.entries.joinToString("&") { "${it.key}=${it.value}" })
            }

            val request = Request.Builder()
                .url(url.toString())
                .post(bodyBuilder.build())
                .build()

            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val bytes = response.body?.bytes() ?: ByteArray(0)
                val headers = mapOf(
                    "X-Original-Size" to response.header("X-Original-Size"),
                    "X-Compressed-Size" to response.header("X-Compressed-Size"),
                )
                ApiResult.Success(bytes, headers)
            } else {
                ApiResult.Error("Server error ${response.code}: ${response.message}")
            }
        } catch (e: Exception) {
            ApiResult.Error("Network error: ${e.message}")
        }
    }

    // ── Public API methods ────────────────────────────────────────────────────

    suspend fun shrinkImage(
        context: Context,
        uri: Uri,
        quality: Int = 75,
        maxWidth: Int = 1920,
    ): ApiResult {
        val bytes = readBytes(context, uri) ?: return ApiResult.Error("Could not read image")
        val mime = mimeType(context, uri)
        return postImage(
            "/api/shrink-image?quality=$quality&max_width=$maxWidth",
            bytes, mime
        )
    }

    suspend fun removeBackground(context: Context, uri: Uri): ApiResult {
        val bytes = readBytes(context, uri) ?: return ApiResult.Error("Could not read image")
        val mime = mimeType(context, uri)
        return postImage("/api/remove-background", bytes, mime)
    }

    suspend fun cropImage(
        context: Context,
        uri: Uri,
        x: Int, y: Int, width: Int, height: Int,
    ): ApiResult {
        val bytes = readBytes(context, uri) ?: return ApiResult.Error("Could not read image")
        val mime = mimeType(context, uri)
        return postImage(
            "/api/crop-image?x=$x&y=$y&width=$width&height=$height",
            bytes, mime
        )
    }

    suspend fun applyFilter(
        context: Context,
        uri: Uri,
        filter: String,
        intensity: Float = 1.0f,
    ): ApiResult {
        val bytes = readBytes(context, uri) ?: return ApiResult.Error("Could not read image")
        val mime = mimeType(context, uri)
        return postImage(
            "/api/image-filter?filter=$filter&intensity=$intensity",
            bytes, mime
        )
    }
}
