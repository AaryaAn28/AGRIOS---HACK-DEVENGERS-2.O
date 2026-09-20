import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';

class BroadcastCircularsScreen extends StatefulWidget {
  const BroadcastCircularsScreen({super.key});

  @override
  State<BroadcastCircularsScreen> createState() => _BroadcastCircularsScreenState();
}

class _BroadcastCircularsScreenState extends State<BroadcastCircularsScreen> {
  String selectedDistrict = 'Ludhiana';
  String selectedLanguage = 'English';
  String selectedCategory = 'Weather warning';
  final messageController = TextEditingController();

  final districts = ['Ludhiana', 'Sangrur', 'Patiala', 'Bhatinda'];
  final languages = ['English', 'Hindi', 'Punjabi'];
  final categories = ['Weather warning', 'Pest alert', 'Irrigation recommendation', 'Mandi rate guidance'];

  @override
  void initState() {
    super.initState();
    _updateTemplate();
  }

  void _updateTemplate() {
    messageController.text = 'Advisory [$selectedCategory] for $selectedDistrict farmers: Please take necessary precautions.';
  }

  void _broadcast() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Dispatch Simulation'),
        content: const Text('Dispatching SMS & WhatsApp advisory to 4,200 registered farmers...'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Broadcast completed!')));
            },
            child: const Text('OK'),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CommonAppBar(title: 'Advisory Circular Dispatcher', subtitle: 'SMS & WhatsApp'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    decoration: const InputDecoration(labelText: 'District', border: OutlineInputBorder()),
                    value: selectedDistrict,
                    items: districts.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
                    onChanged: (v) { setState(() => selectedDistrict = v!); _updateTemplate(); },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    decoration: const InputDecoration(labelText: 'Language', border: OutlineInputBorder()),
                    value: selectedLanguage,
                    items: languages.map((l) => DropdownMenuItem(value: l, child: Text(l))).toList(),
                    onChanged: (v) { setState(() => selectedLanguage = v!); _updateTemplate(); },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder()),
              value: selectedCategory,
              items: categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
              onChanged: (v) { setState(() => selectedCategory = v!); _updateTemplate(); },
            ),
            const SizedBox(height: 16),
            TextField(
              controller: messageController,
              maxLines: 5,
              decoration: const InputDecoration(border: OutlineInputBorder(), labelText: 'Message Content'),
            ),
            const SizedBox(height: 24),
            CustomButton(text: 'Broadcast Advisory to 4,200 Registered Farmers', onPressed: _broadcast, width: double.infinity),
          ],
        ),
      ),
    );
  }
}
