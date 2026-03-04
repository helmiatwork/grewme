package com.grewme.parent.ui.child

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.grewme.parent.data.repository.RadarRepository
import com.grewme.parent.domain.model.RadarData
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

sealed interface RadarUiState {
    data object Loading : RadarUiState
    data class Success(val data: RadarData) : RadarUiState
    data class Error(val message: String) : RadarUiState
}

class ChildRadarViewModel(
    private val studentId: Long,
    private val repository: RadarRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<RadarUiState>(RadarUiState.Loading)
    val uiState: StateFlow<RadarUiState> = _uiState.asStateFlow()

    init {
        observe()
        refresh()
    }

    private fun observe() {
        viewModelScope.launch {
            repository.getRadarData(studentId).collect { data ->
                if (data != null) {
                    _uiState.value = RadarUiState.Success(data)
                }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            try {
                repository.refresh(studentId)
            } catch (e: Exception) {
                if (_uiState.value is RadarUiState.Loading) {
                    _uiState.value = RadarUiState.Error(e.message ?: "Failed to load radar data")
                }
            }
        }
    }
}
