package com.pixelshrink.studio.ui.tools

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.pixelshrink.studio.processing.ImageProcessor

// ─────────────────────────────────────────────────────────────────────────────
// 1. SHRINK IMAGE
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun ShrinkImageScreen(onBack: () -> Unit) {
    var quality by remember { mutableStateOf(75f) }

    ImageToolScreen(
        title = "Shrink Image",
        description = "Compress your image to a smaller file size without losing too much quality. Great for sharing on WhatsApp or email.",
        actionLabel = "🗜️ Shrink It!",
        onBack = onBack,
        extraControls = {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(Modifier.padding(16.dp)) {
                    Text(
                        "Quality: ${quality.toInt()}%",
                        fontWeight = FontWeight.Bold,
                        color = Green
                    )
                    Slider(
                        value = quality,
                        onValueChange = { quality = it },
                        valueRange = 20f..95f,
                        colors = SliderDefaults.colors(
                            thumbColor = Green,
                            activeTrackColor = Green
                        )
                    )
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Smaller file", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                        Text("Better quality", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    }
                }
            }
        },
        processImage = { context, uri ->
            ImageProcessor.shrinkImage(context, uri, quality = quality.toInt())
        }
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. REMOVE BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────
@Composable
fun RemoveBackgroundScreen(onBack: () -> Unit) {
    ImageToolScreen(
        title = "Remove Background",
        description = "Automatically remove the background from a photo — fully on-device, no internet needed. Works best on photos of people.",
        actionLabel = "✂️ Remove Background",
        onBack = onBack,
        processImage = { context, uri ->
            ImageProcessor.removeBackground(context, uri)
        }
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. IMAGE FILTERS
// ─────────────────────────────────────────────────────────────────────────────
val FILTERS = listOf(
    "grayscale" to "⬜ Grayscale",
    "sepia"     to "🟫 Sepia",
    "vintage"   to "🎞️ Vintage",
    "sharpen"   to "🔪 Sharpen",
    "blur"      to "🌫️ Blur",
    "invert"    to "🔄 Invert",
    "brightness" to "☀️ Brightness",
    "contrast"  to "🌓 Contrast",
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ImageFiltersScreen(onBack: () -> Unit) {
    var selectedFilter by remember { mutableStateOf("grayscale") }
    var intensity by remember { mutableStateOf(1.2f) }

    ImageToolScreen(
        title = "Image Filters",
        description = "Apply creative filters to your photos — grayscale, sepia, vintage, sharpen and more.",
        actionLabel = "🎨 Apply Filter",
        onBack = onBack,
        extraControls = {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(Modifier.padding(12.dp)) {
                    Text("Choose Filter", fontWeight = FontWeight.Bold, color = Green)
                    Spacer(Modifier.height(8.dp))
                    FILTERS.chunked(3).forEach { row ->
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            row.forEach { (key, label) ->
                                FilterChip(
                                    selected = selectedFilter == key,
                                    onClick = { selectedFilter = key },
                                    label = {
                                        Text(label, style = MaterialTheme.typography.labelSmall)
                                    },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = Green,
                                        selectedLabelColor = Color.White,
                                    )
                                )
                            }
                        }
                        Spacer(Modifier.height(4.dp))
                    }
                    if (selectedFilter in listOf("brightness", "contrast")) {
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "Intensity: ${String.format("%.1f", intensity)}x",
                            fontWeight = FontWeight.Bold,
                            color = Green
                        )
                        Slider(
                            value = intensity,
                            onValueChange = { intensity = it },
                            valueRange = 0.5f..2.5f,
                            colors = SliderDefaults.colors(
                                thumbColor = Green,
                                activeTrackColor = Green
                            )
                        )
                    }
                }
            }
        },
        processImage = { context, uri ->
            ImageProcessor.applyFilter(context, uri, selectedFilter, intensity)
        }
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CROP IMAGE
// ─────────────────────────────────────────────────────────────────────────────
data class CropPreset(val label: String, val ratioW: Float, val ratioH: Float)

val CROP_PRESETS = listOf(
    CropPreset("1:1",   1f,  1f),
    CropPreset("3:4",   3f,  4f),
    CropPreset("4:3",   4f,  3f),
    CropPreset("16:9", 16f,  9f),
    CropPreset("9:16",  9f, 16f),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CropImageScreen(onBack: () -> Unit) {
    var selectedPreset by remember { mutableStateOf(CROP_PRESETS[0]) }

    ImageToolScreen(
        title = "Crop Image",
        description = "Crop your image to a standard ratio — perfect for Instagram, stories, or printing.",
        actionLabel = "✂️ Crop Image",
        onBack = onBack,
        extraControls = {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(Modifier.padding(12.dp)) {
                    Text("Crop Ratio", fontWeight = FontWeight.Bold, color = Green)
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        CROP_PRESETS.forEach { preset ->
                            FilterChip(
                                selected = selectedPreset == preset,
                                onClick = { selectedPreset = preset },
                                label = {
                                    Text(preset.label, style = MaterialTheme.typography.labelSmall)
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Green,
                                    selectedLabelColor = Color.White,
                                ),
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
        },
        processImage = { context, uri ->
            ImageProcessor.cropToRatio(context, uri, selectedPreset.ratioW, selectedPreset.ratioH)
        }
    )
}
