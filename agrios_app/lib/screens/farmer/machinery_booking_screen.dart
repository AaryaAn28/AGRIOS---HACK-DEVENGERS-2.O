import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';

class MachineryBookingScreen extends StatefulWidget {
  const MachineryBookingScreen({super.key});

  @override
  State<MachineryBookingScreen> createState() => _MachineryBookingScreenState();
}

class _MachineryBookingScreenState extends State<MachineryBookingScreen> {
  final equipmentList = [
    {'name': 'Laser Land Leveler', 'rate': '₹800/hr', 'subsidy': '50%'},
    {'name': 'Drone Sprayer (16L Hexacopter)', 'rate': '₹500/acre', 'subsidy': '40%'},
    {'name': 'Multi-crop Combine Harvester', 'rate': '₹2000/hr', 'subsidy': '25%'},
    {'name': 'Tractor Mounted Subsoiler', 'rate': '₹1200/hr', 'subsidy': '50%'},
    {'name': 'Happy Seeder', 'rate': '₹1000/hr', 'subsidy': '50%'},
  ];

  DateTime? selectedDate;
  String selectedFarm = 'Parcel A (Wheat)';

  void _book(String equipmentName) {
    if (selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a date first.')));
      return;
    }
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Booking Ticket Generation'),
        content: Text('Booking $equipmentName on ${selectedDate!.toLocal().toString().split(' ')[0]} for $selectedFarm with PM-KISAN Subsidy applied.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          CustomButton(
            text: 'Confirm',
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Machinery Booked! Ticket sent via SMS.')));
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CommonAppBar(title: 'Precision Machinery Booking', subtitle: 'Custom Hiring Center (CHC)'),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 30)),
                      );
                      if (date != null) setState(() => selectedDate = date);
                    },
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'Select Date', border: OutlineInputBorder()),
                      child: Text(selectedDate == null ? 'Choose Date' : selectedDate!.toLocal().toString().split(' ')[0]),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    decoration: const InputDecoration(labelText: 'Farm Parcel', border: OutlineInputBorder()),
                    value: selectedFarm,
                    items: ['Parcel A (Wheat)', 'Parcel B (Mustard)']
                        .map((f) => DropdownMenuItem(value: f, child: Text(f)))
                        .toList(),
                    onChanged: (v) => setState(() => selectedFarm = v!),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            const Text('Equipment Catalog', style: AppTextStyles.h2),
            const SizedBox(height: 8),
            Expanded(
              child: ListView.builder(
                itemCount: equipmentList.length,
                itemBuilder: (ctx, i) {
                  final eq = equipmentList[i];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(eq['name']!, style: AppTextStyles.h3),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Rate: ${eq['rate']}', style: AppTextStyles.bodyBold),
                              Text('Subsidy: ${eq['subsidy']}', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          CustomButton(
                            text: 'Book with Subsidy',
                            onPressed: () => _book(eq['name']!),
                            width: double.infinity,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
