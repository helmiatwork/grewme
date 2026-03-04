package com.grewme.parent.ui.child

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.grewme.parent.data.repository.DailyScoreRepository
import com.grewme.parent.domain.model.DailyScore
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

sealed interface HistoryUiState {
    data object Loading : HistoryUiState
    data class Success(val scores: List<DailyScore>) : HistoryUiState
    data class Error(val message: String) : HistoryUiState
}

class ChildHistoryViewModel(
    private val studentId: Long,
    private val repository: DailyScoreRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<HistoryUiState>(HistoryUiState.Loading)
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()

    init {
        observe()
        refresh()
    }

    private fun observe() {
        viewModelScope.launch {
            repository.getScores(studentId).collect { scores ->
                if (scores.isNotEmpty() || _uiState.value !is HistoryUiState.Loading) {
                    _uiState.value = HistoryUiState.Success(scores)
                }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            try {
                repository.refresh(studentId)
            } catch (e: Exception) {
                if (_uiState.value !is HistoryUiState.Loading) {
                    _uiState.value = HistoryUiState.Error(e.message ?: "Failed to load scores")
                }
            }
        }
    }
}
