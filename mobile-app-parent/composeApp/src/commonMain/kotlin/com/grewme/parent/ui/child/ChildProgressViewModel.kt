package com.grewme.parent.ui.child

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.grewme.parent.data.repository.ProgressRepository
import com.grewme.parent.domain.model.ProgressEntry
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

sealed interface ProgressUiState {
    data object Loading : ProgressUiState
    data class Success(val entries: List<ProgressEntry>) : ProgressUiState
    data class Error(val message: String) : ProgressUiState
}

class ChildProgressViewModel(
    private val studentId: Long,
    private val repository: ProgressRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<ProgressUiState>(ProgressUiState.Loading)
    val uiState: StateFlow<ProgressUiState> = _uiState.asStateFlow()

    init {
        observe()
        refresh()
    }

    private fun observe() {
        viewModelScope.launch {
            repository.getProgress(studentId).collect { entries ->
                if (entries.isNotEmpty() || _uiState.value !is ProgressUiState.Loading) {
                    _uiState.value = ProgressUiState.Success(entries)
                }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            try {
                repository.refresh(studentId)
            } catch (e: Exception) {
                if (_uiState.value is ProgressUiState.Loading) {
                    _uiState.value = ProgressUiState.Error(e.message ?: "Failed to load progress")
                }
            }
        }
    }
}
