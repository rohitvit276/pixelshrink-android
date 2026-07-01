package com.pixelshrink.studio

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.pixelshrink.studio.ui.HomeScreen
import com.pixelshrink.studio.ui.ToolPlaceholderScreen
import com.pixelshrink.studio.ui.toolDestinations
import com.pixelshrink.studio.ui.tools.CropImageScreen
import com.pixelshrink.studio.ui.tools.ImageFiltersScreen
import com.pixelshrink.studio.ui.tools.RemoveBackgroundScreen
import com.pixelshrink.studio.ui.tools.ShrinkImageScreen

enum class BottomRoute(val route: String, val label: String) {
    Home("home", "Home"),
    Tools("tools", "Tools")
}

@Composable
fun PixelShrinkApp() {
    val navController = rememberNavController()

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            val backStackEntry by navController.currentBackStackEntryAsState()
            val currentDestination = backStackEntry?.destination
            NavigationBar {
                listOf(BottomRoute.Home, BottomRoute.Tools).forEach { screen ->
                    val selected =
                        currentDestination?.hierarchy?.any { it.route == screen.route } == true
                    NavigationBarItem(
                        selected = selected,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = {
                            when (screen) {
                                BottomRoute.Home -> Icon(
                                    imageVector = if (selected) Icons.Filled.Home else Icons.Outlined.Home,
                                    contentDescription = screen.label
                                )
                                BottomRoute.Tools -> Icon(
                                    imageVector = if (selected) Icons.Filled.Settings else Icons.Outlined.Settings,
                                    contentDescription = screen.label
                                )
                            }
                        },
                        label = { Text(screen.label) }
                    )
                }
            }
        }
    ) { padding ->
        AppNavGraph(padding, navController)
    }
}

@Composable
private fun AppNavGraph(
    padding: PaddingValues,
    navController: androidx.navigation.NavHostController,
) {
    NavHost(
        navController = navController,
        startDestination = BottomRoute.Home.route,
        modifier = Modifier.padding(padding)
    ) {
        // ── Bottom tabs ───────────────────────────────────────────────────
        composable(BottomRoute.Home.route) {
            HomeScreen(onToolClick = { tool -> navController.navigate(tool.route) })
        }
        composable(BottomRoute.Tools.route) {
            ToolPlaceholderScreen(
                title = "All Tools",
                description = "Choose a tool from the home grid."
            )
        }

        // ── REAL connected tool screens ───────────────────────────────────
        // Routes must match ToolDestination.route values from HomeScreen.
        composable("tool/shrink-image") {
            ShrinkImageScreen(onBack = { navController.popBackStack() })
        }
        composable("tool/remove-background") {
            RemoveBackgroundScreen(onBack = { navController.popBackStack() })
        }
        composable("tool/image-filters") {
            ImageFiltersScreen(onBack = { navController.popBackStack() })
        }
        composable("tool/crop-image") {
            CropImageScreen(onBack = { navController.popBackStack() })
        }

        // ── Remaining tools: still placeholder (to be wired up next) ─────
        val connectedRoutes = setOf(
            "tool/shrink-image",
            "tool/remove-background",
            "tool/image-filters",
            "tool/crop-image"
        )
        toolDestinations
            .filter { it.route !in connectedRoutes }
            .forEach { tool ->
                composable(tool.route) {
                    ToolPlaceholderScreen(
                        title = tool.title,
                        description = "Coming soon! We're working on this tool. 🚧"
                    )
                }
            }
    }
}
