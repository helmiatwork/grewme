package com.grewme.parent.ui.child

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.grewme.parent.domain.model.DailyScore
import com.grewme.parent.domain.model.ProgressEntry
import com.grewme.parent.domain.model.RadarData
import com.grewme.parent.ui.components.ErrorState
import com.grewme.parent.ui.components.LoadingState
import com.grewme.parent.ui.components.RadarChart
import com.grewme.parent.ui.components.RadarChartData
import org.koin.compose.viewmodel.koinViewModel
import org.koin.core.parameter.parametersOf

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChildDetailScreen(
    childId: Long,
    childName: String,
    onBack: () -> Unit,
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Radar", "Progress", "History")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(childName) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Text("←", style = MaterialTheme.typography.titleLarge)
                    }
                },
            )
        },
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            TabRow(selectedTabIndex = selectedTab) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { Text(title) },
                    )
                }
            }

            when (selectedTab) {
                0 -> RadarTab(childId)
                1 -> ProgressTab(childId)
                2 -> HistoryTab(childId)
            }
        }
    }
}

@Composable
private fun RadarTab(childId: Long) {
    val viewModel: ChildRadarViewModel = koinViewModel { parametersOf(childId) }
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        RadarUiState.Loading -> LoadingState()
        is RadarUiState.Error -> ErrorState(state.message, onRetry = viewModel::refresh)
        is RadarUiState.Success -> {
            Column(modifier = Modifier.padding(16.dp)) {
                RadarChart(
                    data = state.data.toChartData(),
                    modifier = Modifier.fillMaxWidth(),
                )
                if (state.data.totalDaysScored != null) {
                    Text(
                        text = "Based on ${state.data.totalDaysScored} days of scores",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

@Composable
private fun ProgressTab(childId: Long) {
    val viewModel: ChildProgressViewModel = koinViewModel { parametersOf(childId) }
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        ProgressUiState.Loading -> LoadingState()
        is ProgressUiState.Error -> ErrorState(state.message, onRetry = viewModel::refresh)
        is ProgressUiState.Success -> {
            if (state.entries.isEmpty()) {
                ErrorState(message = "No progress data yet")
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    items(state.entries) { entry ->
                        ProgressCard(entry)
                    }
                }
            }
        }
    }
}

@Composable
private fun ProgressCard(entry: ProgressEntry) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = entry.period, style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
            SkillRow("Reading", entry.reading)
            SkillRow("Math", entry.math)
            SkillRow("Writing", entry.writing)
            SkillRow("Logic", entry.logic)
            SkillRow("Social", entry.social)
        }
    }
}

@Composable
private fun SkillRow(label: String, value: Double) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(text = label, style = MaterialTheme.typography.bodyMedium)
        Text(
            text = if (value > 0) ((value * 10).toInt() / 10.0).toString() else "-",
            style = MaterialTheme.typography.bodyMedium,
        )
    }
}

@Composable
private fun HistoryTab(childId: Long) {
    val viewModel: ChildHistoryViewModel = koinViewModel { parametersOf(childId) }
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        HistoryUiState.Loading -> LoadingState()
        is HistoryUiState.Error -> ErrorState(state.message, onRetry = viewModel::refresh)
        is HistoryUiState.Success -> {
            if (state.scores.isEmpty()) {
                ErrorState(message = "No scores recorded yet")
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    items(state.scores, key = { it.id }) { score ->
                        ScoreRow(score)
                    }
                }
            }
        }
    }
}

@Composable
private fun ScoreRow(score: DailyScore) {
    ListItem(
        headlineContent = {
            Text("${score.skillCategory.replaceFirstChar { it.uppercase() }}: ${score.score}")
        },
        supportingContent = {
            Text(score.date)
        },
        trailingContent = score.notes?.let {
            { Text(it, style = MaterialTheme.typography.bodySmall) }
        },
    )
}

private fun RadarData.toChartData() = RadarChartData(
    labels = listOf("Reading", "Math", "Writing", "Logic", "Social"),
    values = listOf(
        reading.toFloat(),
        math.toFloat(),
        writing.toFloat(),
        logic.toFloat(),
        social.toFloat(),
    ),
)
