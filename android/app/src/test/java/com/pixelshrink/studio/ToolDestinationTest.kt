package com.pixelshrink.studio

import com.pixelshrink.studio.ui.toolDestinations
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ToolDestinationTest {

    @Test
    fun allExpectedToolDestinationsExist() {
        val titles = toolDestinations.map { it.title }
        val expected = listOf(
            "Shrink Image",
            "Remove Background",
            "Crop Image",
            "Image Filters",
            "Moustachify",
            "PDF → Word",
            "Word → PDF",
            "Compress Video",
            "Video → MP3",
            "AI Image Generator",
            "Text to Image"
        )

        assertEquals(expected, titles)
        assertTrue(toolDestinations.all { it.route.startsWith("tool/") })
    }
}
