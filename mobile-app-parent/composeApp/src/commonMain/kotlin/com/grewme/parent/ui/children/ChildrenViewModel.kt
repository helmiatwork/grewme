package com.grewme.parent.ui.children

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.grewme.parent.data.repository.ChildRepository
import com.grewme.parent.domain.model.Child
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

sealed interface ChildrenUiState {
    data object Loading : ChildrenUiState
    data class Success(val children: List<Child>, val isRefreshing: Boolean = false) : ChildrenUiState
    data class Error(val message: String) : ChildrenUiState
}

class ChildrenViewModel(
    private val repository: ChildRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<ChildrenUiState>(ChildrenUiState.Loading)
    val uiState: StateFlow<ChildrenUiState> = _uiState.asStateFlow()

    init {
        observeChildren()
        refresh()
    }

    private fun observeChildren() {
        viewModelScope.launch {
            repository.getChildren().collect { children ->
                if (children.isNotEmpty() || _uiState.value !is ChildrenUiState.Loading) {
                    _uiState.value = ChildrenUiState.Success(children)
                }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            val current = _uiState.value
            if (current is ChildrenUiState.Success) {
                _uiState.value = current.copy(isRefreshing = true)
            }
            try {
                repository.refresh()
            } catch (e: Exception) {
                if (_uiState.value is ChildrenUiState.Loading) {
                    _uiState.value = ChildrenUiState.Error(e.message ?: "Failed to load children")
                }
                // If we have cached data, keep showing it
            } finally {
                val updated = _uiState.value
                if (updated is ChildrenUiState.Success) {
                    _uiState.value = updated.copy(isRefreshing = false)
                }
            }
        }
    }
}
