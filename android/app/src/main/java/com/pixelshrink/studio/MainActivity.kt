package com.pixelshrink.studio

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.pixelshrink.studio.ui.theme.PixelShrinkTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PixelShrinkTheme {
                PixelShrinkApp()
            }
        }
    }
}
