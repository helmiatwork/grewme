package com.grewme.parent

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import com.grewme.parent.di.appModule
import com.grewme.parent.di.platformModule
import com.grewme.parent.data.local.token.TokenStorage
import com.grewme.parent.navigation.ChildDetailRoute
import com.grewme.parent.navigation.ChildrenRoute
import com.grewme.parent.navigation.LoginRoute
import com.grewme.parent.ui.auth.LoginScreen
import com.grewme.parent.ui.child.ChildDetailScreen
import com.grewme.parent.ui.children.ChildrenScreen
import org.koin.compose.KoinApplication
import org.koin.compose.koinInject

@Composable
fun App() {
    KoinApplication(application = {
        modules(platformModule, appModule)
    }) {
        val tokenStorage: TokenStorage = koinInject()
        val startDestination: Any = remember {
            if (tokenStorage.getAccessToken() != null) ChildrenRoute else LoginRoute
        }

        MaterialTheme {
            Surface(modifier = Modifier.fillMaxSize()) {
                val navController = rememberNavController()

                NavHost(navController = navController, startDestination = startDestination) {
                    composable<LoginRoute> {
                        LoginScreen(onLoginSuccess = {
                            navController.navigate(ChildrenRoute) {
                                popUpTo(LoginRoute) { inclusive = true }
                            }
                        })
                    }
                    composable<ChildrenRoute> {
                        ChildrenScreen(
                            onChildClick = { child ->
                                navController.navigate(ChildDetailRoute(child.id, child.name))
                            },
                            onLogout = {
                                tokenStorage.clearTokens()
                                navController.navigate(LoginRoute) {
                                    popUpTo(0) { inclusive = true }
                                }
                            },
                        )
                    }
                    composable<ChildDetailRoute> { backStackEntry ->
                        val route = backStackEntry.toRoute<ChildDetailRoute>()
                        ChildDetailScreen(
                            childId = route.childId,
                            childName = route.childName,
                            onBack = { navController.popBackStack() },
                        )
                    }
                }
            }
        }
    }
}
