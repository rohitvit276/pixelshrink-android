package com.pixelshrink.studio.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.BorderColor
import androidx.compose.material.icons.filled.ContentCut
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Filter
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material.icons.filled.SmartToy
import androidx.compose.material.icons.filled.UploadFile
import androidx.compose.material.icons.filled.VideoFile
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun HomeScreen(onToolClick: (ToolDestination) -> Unit) {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(2) }) {
                HeaderBlock()
            }
            item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(2) }) {
                CategoryRow()
            }
            items(toolDestinations) { tool ->
                ToolCard(tool = tool, onClick = { onToolClick(tool) })
            }
        }
    }
}

@Composable
private fun HeaderBlock() {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(
                text = "PixelShrink Studio",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = "Fast image, document, and video tools for creators.",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "Start with any tool below. Processing integration can be connected to your existing backend APIs next.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun CategoryRow() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(16.dp))
            .padding(horizontal = 10.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceAround
    ) {
        listOf("Image", "Document", "Video", "AI").forEach { label ->
            Text(
                text = label,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
private fun ToolCard(tool: ToolDestination, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(132.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Icon(
                imageVector = tool.icon,
                contentDescription = tool.title,
                tint = MaterialTheme.colorScheme.primary
            )
            Column {
                Text(text = tool.title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                Text(
                    text = tool.category,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

data class ToolDestination(
    val route: String,
    val title: String,
    val category: String,
    val icon: ImageVector,
    val placeholder: String
)

val toolDestinations = listOf(
    ToolDestination("tool/shrink-image", "Shrink Image", "Image", Icons.Filled.ContentCut, "Placeholder for image resize/compression flow."),
    ToolDestination("tool/remove-background", "Remove Background", "Image", Icons.Filled.AutoAwesome, "Placeholder for background removal integration."),
    ToolDestination("tool/crop-image", "Crop Image", "Image", Icons.Filled.GridView, "Placeholder for crop editor and aspect ratio presets."),
    ToolDestination("tool/image-filters", "Image Filters", "Image", Icons.Filled.Filter, "Placeholder for filter controls and preview."),
    ToolDestination("tool/moustachify", "Moustachify", "Image", Icons.Filled.SmartToy, "Placeholder for moustache style selection and preview."),
    ToolDestination("tool/pdf-to-word", "PDF → Word", "Document", Icons.Filled.Description, "Placeholder for document upload and conversion."),
    ToolDestination("tool/word-to-pdf", "Word → PDF", "Document", Icons.Filled.PictureAsPdf, "Placeholder for DOCX to PDF conversion flow."),
    ToolDestination("tool/compress-video", "Compress Video", "Video", Icons.Filled.VideoFile, "Placeholder for codec/quality controls."),
    ToolDestination("tool/video-to-mp3", "Video → MP3", "Video", Icons.Filled.MusicNote, "Placeholder for audio extraction setup."),
    ToolDestination("tool/ai-image-generator", "AI Image Generator", "AI", Icons.Filled.Image, "Placeholder for prompt + generation API integration."),
    ToolDestination("tool/text-to-image", "Text to Image", "AI", Icons.Filled.BorderColor, "Placeholder for styled text-to-image editor.")
)
