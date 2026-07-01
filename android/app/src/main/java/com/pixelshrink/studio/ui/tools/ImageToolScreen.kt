package com.pixelshrink.studio.ui.tools

import android.content.ContentValues
import android.content.Context
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pixelshrink.studio.processing.ImageProcessor
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

val Green = Color(0xFF059669)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ImageToolScreen(
    title: String,
    description: String,
    actionLabel: String,
    onBack: () -> Unit,
    extraControls: @Composable (() -> Unit)? = null,
    processImage: suspend (Context, Uri) -> ImageProcessor.ToolResult,
) {
    val context = LocalContext.current
    var selectedUri  by remember { mutableStateOf<Uri?>(null) }
    var resultBytes  by remember { mutableStateOf<ByteArray?>(null) }
    var isLoading    by remember { mutableStateOf(false) }
    var errorMsg     by remember { mutableStateOf<String?>(null) }
    var infoMsg      by remember { mutableStateOf<String?>(null) }

    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        selectedUri = uri
        resultBytes = null
        errorMsg    = null
        infoMsg     = null
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White,
                    titleContentColor = Green,
                    navigationIconContentColor = Green,
                )
            )
        },
        containerColor = Color(0xFFF5F5F5)
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {

            // Description
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Text(
                    description,
                    modifier = Modifier.padding(16.dp),
                    color = Color.Gray,
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center
                )
            }

            // Image preview
            Card(
                modifier = Modifier.fillMaxWidth().height(260.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    when {
                        resultBytes != null -> {
                            val bmp = BitmapFactory.decodeByteArray(resultBytes!!, 0, resultBytes!!.size)
                            if (bmp != null) {
                                Image(
                                    bitmap = bmp.asImageBitmap(),
                                    contentDescription = "Result",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Fit
                                )
                            }
                        }
                        selectedUri != null -> {
                            val bmp = remember(selectedUri) {
                                ImageProcessor.decodeOriented(context, selectedUri!!, maxDim = 1024)
                            }
                            if (bmp != null) {
                                Image(
                                    bitmap = bmp.asImageBitmap(),
                                    contentDescription = "Selected",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Fit
                                )
                            }
                        }
                        else -> {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("🖼️", fontSize = 48.sp)
                                Spacer(Modifier.height(8.dp))
                                Text("No image selected", color = Color.Gray, fontSize = 14.sp)
                            }
                        }
                    }

                    if (isLoading) {
                        Box(
                            Modifier
                                .fillMaxSize()
                                .background(Color.Black.copy(alpha = 0.4f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                CircularProgressIndicator(color = Green)
                                Spacer(Modifier.height(8.dp))
                                Text("Processing…", color = Color.White, fontSize = 13.sp)
                            }
                        }
                    }
                }
            }

            // Success banner
            infoMsg?.let {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F5E9)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("✅ $it", modifier = Modifier.padding(12.dp),
                        color = Color(0xFF2E7D32), fontSize = 13.sp)
                }
            }

            // Error banner
            errorMsg?.let {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFEBEE)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("❌ $it", modifier = Modifier.padding(12.dp),
                        color = Color(0xFFC62828), fontSize = 13.sp)
                }
            }

            // Extra controls (sliders, chips, etc.)
            extraControls?.invoke()

            // Pick image
            OutlinedButton(
                onClick = { launcher.launch("image/*") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Green),
            ) {
                Text("📁 Pick Image from Gallery", fontWeight = FontWeight.Bold)
            }

            // Process
            Button(
                onClick = {
                    val uri = selectedUri ?: run {
                        Toast.makeText(context, "Please pick an image first", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    isLoading   = true
                    errorMsg    = null
                    infoMsg     = null
                    resultBytes = null

                    CoroutineScope(Dispatchers.Main).launch {
                        val result = withContext(Dispatchers.IO) { processImage(context, uri) }
                        isLoading = false
                        when (result) {
                            is ImageProcessor.ToolResult.Success -> {
                                resultBytes = result.bytes
                                val orig = result.info["X-Original-Size"]
                                val comp = result.info["X-Compressed-Size"]
                                infoMsg = if (orig != null && comp != null)
                                    "Done! $orig KB → $comp KB"
                                else
                                    "Done! Tap Save to keep the result."
                            }
                            is ImageProcessor.ToolResult.Error -> {
                                errorMsg = result.message
                            }
                        }
                    }
                },
                enabled = selectedUri != null && !isLoading,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Green)
            ) {
                Text(actionLabel, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }

            // Save to gallery
            if (resultBytes != null) {
                Button(
                    onClick = {
                        saveImageToGallery(context, resultBytes!!, title)
                        Toast.makeText(context, "Saved to Gallery! 🎉", Toast.LENGTH_SHORT).show()
                    },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1565C0))
                ) {
                    Text("💾 Save to Gallery", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}

fun saveImageToGallery(context: Context, bytes: ByteArray, toolName: String) {
    // Remove Background outputs PNG (transparency); everything else is JPEG.
    val isPng = bytes.size > 4 &&
        bytes[0] == 0x89.toByte() && bytes[1] == 'P'.code.toByte() &&
        bytes[2] == 'N'.code.toByte() && bytes[3] == 'G'.code.toByte()
    val ext = if (isPng) "png" else "jpg"
    val mime = if (isPng) "image/png" else "image/jpeg"
    val filename = "${toolName.replace(" ", "_")}_${System.currentTimeMillis()}.$ext"
    val resolver = context.contentResolver
    val cv = ContentValues().apply {
        put(MediaStore.Images.Media.DISPLAY_NAME, filename)
        put(MediaStore.Images.Media.MIME_TYPE, mime)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            put(MediaStore.Images.Media.RELATIVE_PATH,
                Environment.DIRECTORY_PICTURES + "/PixelShrink")
            put(MediaStore.Images.Media.IS_PENDING, 1)
        }
    }
    val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv)
    uri?.let {
        resolver.openOutputStream(it)?.use { s -> s.write(bytes) }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            cv.clear()
            cv.put(MediaStore.Images.Media.IS_PENDING, 0)
            resolver.update(it, cv, null, null)
        }
    }
}
