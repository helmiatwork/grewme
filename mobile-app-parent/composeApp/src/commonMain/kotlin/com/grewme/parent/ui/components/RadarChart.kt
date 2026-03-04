package com.grewme.parent.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.*
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

data class RadarChartData(
    val labels: List<String>,
    val values: List<Float>, // 0f..100f
)

@OptIn(ExperimentalTextApi::class)
@Composable
fun RadarChart(
    data: RadarChartData,
    modifier: Modifier = Modifier,
    gridColor: Color = MaterialTheme.colorScheme.outlineVariant,
    fillColor: Color = MaterialTheme.colorScheme.primary.copy(alpha = 0.3f),
    strokeColor: Color = MaterialTheme.colorScheme.primary,
    gridLevels: Int = 3,
) {
    val animatedValues = data.values.map { value ->
        animateFloatAsState(
            targetValue = value.coerceIn(0f, 100f) / 100f,
            animationSpec = tween(durationMillis = 600),
            label = "radar_value",
        )
    }

    val textMeasurer = rememberTextMeasurer()
    val labelStyle = TextStyle(
        fontSize = 12.sp,
        color = MaterialTheme.colorScheme.onSurface,
    )

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(1f)
            .padding(32.dp)
    ) {
        val center = Offset(size.width / 2f, size.height / 2f)
        val radius = size.minDimension / 2f
        val axisCount = data.labels.size
        val angleStep = 2 * PI.toFloat() / axisCount
        val startAngle = -PI.toFloat() / 2f // Start from top

        // Draw grid levels
        for (level in 1..gridLevels) {
            val levelRadius = radius * level / gridLevels
            val gridPath = Path()
            for (i in 0 until axisCount) {
                val angle = startAngle + i * angleStep
                val x = center.x + levelRadius * cos(angle)
                val y = center.y + levelRadius * sin(angle)
                if (i == 0) gridPath.moveTo(x, y) else gridPath.lineTo(x, y)
            }
            gridPath.close()
            drawPath(gridPath, gridColor, style = Stroke(width = 1.dp.toPx()))
        }

        // Draw axis lines
        for (i in 0 until axisCount) {
            val angle = startAngle + i * angleStep
            val endX = center.x + radius * cos(angle)
            val endY = center.y + radius * sin(angle)
            drawLine(gridColor, center, Offset(endX, endY), strokeWidth = 1.dp.toPx())
        }

        // Draw data polygon
        val dataPath = Path()
        for (i in 0 until axisCount) {
            val angle = startAngle + i * angleStep
            val value = animatedValues[i].value
            val x = center.x + radius * value * cos(angle)
            val y = center.y + radius * value * sin(angle)
            if (i == 0) dataPath.moveTo(x, y) else dataPath.lineTo(x, y)
        }
        dataPath.close()
        drawPath(dataPath, fillColor)
        drawPath(dataPath, strokeColor, style = Stroke(width = 2.dp.toPx()))

        // Draw data points
        for (i in 0 until axisCount) {
            val angle = startAngle + i * angleStep
            val value = animatedValues[i].value
            val x = center.x + radius * value * cos(angle)
            val y = center.y + radius * value * sin(angle)
            drawCircle(strokeColor, radius = 4.dp.toPx(), center = Offset(x, y))
        }

        // Draw labels
        for (i in 0 until axisCount) {
            val angle = startAngle + i * angleStep
            val labelRadius = radius + 20.dp.toPx()
            val x = center.x + labelRadius * cos(angle)
            val y = center.y + labelRadius * sin(angle)

            val textLayout = textMeasurer.measure(data.labels[i], labelStyle)
            val textX = x - textLayout.size.width / 2f
            val textY = y - textLayout.size.height / 2f

            drawText(textLayout, topLeft = Offset(textX, textY))
        }
    }
}
