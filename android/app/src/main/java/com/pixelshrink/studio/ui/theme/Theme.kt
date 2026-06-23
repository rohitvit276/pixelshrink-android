package com.pixelshrink.studio.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val PixelShrinkColorScheme = lightColorScheme(
    primary = PixelGreen,
    onPrimary = PixelCard,
    secondary = PixelGreenDark,
    background = PixelLightBackground,
    surface = PixelCard
)

@Composable
fun PixelShrinkTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = PixelShrinkColorScheme,
        typography = Typography,
        content = content
    )
}
