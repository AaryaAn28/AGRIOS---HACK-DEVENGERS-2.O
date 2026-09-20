import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/status_badge.dart';

class SatelliteTelemetryScreen extends StatefulWidget {
  const SatelliteTelemetryScreen({super.key});

  @override
  State<SatelliteTelemetryScreen> createState() => _SatelliteTelemetryScreenState();
}

class _SatelliteTelemetryScreenState extends State<SatelliteTelemetryScreen> {
  String _resolution = '10m Multi-spectral';
  double _cloudCover = 15.0;

  final List<Map<String, dynamic>> _districts = [
    {'name': 'Ludhiana', 'ndvi': 0.72, 'ndwi': 0.15, 'savi': 0.65, 'evi': 0.55, 'alert': 'Normal'},
    {'name': 'Bathinda', 'ndvi': 0.45, 'ndwi': -0.1, 'savi': 0.38, 'evi': 0.30, 'alert': 'Drought Stress'},
    {'name': 'Sangrur', 'ndvi': 0.68, 'ndwi': 0.12, 'savi': 0.60, 'evi': 0.50, 'alert': 'Normal'},
    {'name': 'Firozpur', 'ndvi': 0.35, 'ndwi': 0.40, 'savi': 0.30, 'evi': 0.25, 'alert': 'Waterlogging'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CommonAppBar(
        title: 'Orbital Satellite Telemetry',
        subtitle: 'Sentinel-2 & Landsat-9 Data',
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Sensor Configuration', style: AppTextStyles.h3),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _resolution,
                      decoration: const InputDecoration(
                        labelText: 'Resolution',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      items: const [
                        DropdownMenuItem(value: '10m Multi-spectral', child: Text('10m Multi-spectral (Sentinel-2)')),
                        DropdownMenuItem(value: '30m Thermal', child: Text('30m Thermal (Landsat-9)')),
                      ],
                      onChanged: (v) {
                        if (v != null) setState(() => _resolution = v);
                      },
                    ),
                    const SizedBox(height: 16),
                    Text('Max Cloud Cover: ${_cloudCover.toInt()}%', style: AppTextStyles.bodyBold),
                    Slider(
                      value: _cloudCover,
                      min: 0,
                      max: 50,
                      divisions: 10,
                      label: '${_cloudCover.toInt()}%',
                      onChanged: (v) => setState(() => _cloudCover = v),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text('District Vegetation Index & Stress Alerts', style: AppTextStyles.h2),
            const SizedBox(height: 12),
            ..._districts.map((d) {
              BadgeType alertType = BadgeType.success;
              if (d['alert'] == 'Drought Stress') alertType = BadgeType.warning;
              if (d['alert'] == 'Waterlogging') alertType = BadgeType.danger;

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(d['name'], style: AppTextStyles.h3),
                          StatusBadge(text: d['alert'], type: alertType),
                        ],
                      ),
                      const Divider(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildMetric('NDVI', d['ndvi'].toString()),
                          _buildMetric('NDWI', d['ndwi'].toString()),
                          _buildMetric('SAVI', d['savi'].toString()),
                          _buildMetric('EVI', d['evi'].toString()),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildMetric(String label, String val) {
    return Column(
      children: [
        Text(label, style: AppTextStyles.caption),
        const SizedBox(height: 4),
        Text(val, style: AppTextStyles.code),
      ],
    );
  }
}
