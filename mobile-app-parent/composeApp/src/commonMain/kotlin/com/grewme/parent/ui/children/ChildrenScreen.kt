package com.grewme.parent.ui.children

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.grewme.parent.domain.model.Child
import com.grewme.parent.ui.components.ErrorState
import com.grewme.parent.ui.components.LoadingState
import org.koin.compose.viewmodel.koinViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChildrenScreen(
    onChildClick: (Child) -> Unit,
    onLogout: () -> Unit,
    viewModel: ChildrenViewModel = koinViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Children") },
                actions = {
                    TextButton(onClick = onLogout) {
                        Text("Logout")
                    }
                },
            )
        },
    ) { padding ->
        when (val state = uiState) {
            ChildrenUiState.Loading -> LoadingState(modifier = Modifier.padding(padding))
            is ChildrenUiState.Error -> ErrorState(
                message = state.message,
                onRetry = viewModel::refresh,
                modifier = Modifier.padding(padding),
            )
            is ChildrenUiState.Success -> {
                if (state.children.isEmpty()) {
                    ErrorState(
                        message = "No children linked to your account",
                        modifier = Modifier.padding(padding),
                    )
                } else {
                    LazyColumn(
                        modifier = Modifier.padding(padding),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        items(state.children, key = { it.id }) { child ->
                            ChildCard(child = child, onClick = { onChildClick(child) })
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ChildCard(child: Child, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = child.name,
                    style = MaterialTheme.typography.titleMedium,
                )
            }
        }
    }
}
