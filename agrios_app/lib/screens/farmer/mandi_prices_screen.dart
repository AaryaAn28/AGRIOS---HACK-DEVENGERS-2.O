import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';

class MandiPricesScreen extends StatefulWidget {
  const MandiPricesScreen({super.key});

  @override
  State<MandiPricesScreen> createState() => _MandiPricesScreenState();
}

class _MandiPricesScreenState extends State<MandiPricesScreen> {
  final marketData = [
    {'commodity': 'Wheat (PBW-550)', 'mandi': 'Khanna', 'modal': '₹2,275/Qtl', 'range': '₹2,100 - ₹2,350', 'msp': '₹2,125', 'trend': '+₹45/Qtl'},
    {'commodity': 'Basmati Rice (Pusa 1121)', 'mandi': 'Ludhiana', 'modal': '₹3,800/Qtl', 'range': '₹3,500 - ₹4,100', 'msp': '₹-', 'trend': '+₹120/Qtl'},
    {'commodity': 'Mustard', 'mandi': 'Jalandhar', 'modal': '₹5,400/Qtl', 'range': '₹5,100 - ₹5,600', 'msp': '₹5,450', 'trend': '-₹20/Qtl'},
    {'commodity': 'Cotton', 'mandi': 'Kotkapura', 'modal': '₹6,800/Qtl', 'range': '₹6,500 - ₹7,100', 'msp': '₹6,620', 'trend': '+₹80/Qtl'},
    {'commodity': 'Maize', 'mandi': 'Khanna', 'modal': '₹2,050/Qtl', 'range': '₹1,900 - ₹2,150', 'msp': '₹1,962', 'trend': '+₹15/Qtl'},
  ];

  void _submitInquiry(String commodity) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Sell Inquiry: $commodity'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(decoration: InputDecoration(hintText: 'Quantity (Quintals)')),
            SizedBox(height: 8),
            TextField(decoration: InputDecoration(hintText: 'Expected Date of Arrival')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          CustomButton(
            text: 'Submit',
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Inquiry submitted to Arhtiya!')));
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
      appBar: const CommonAppBar(title: 'Live APMC Mandi Market', subtitle: 'Daily Price Ticker'),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: marketData.length,
        itemBuilder: (ctx, i) {
          final data = marketData[i];
          final trendPositive = data['trend']!.startsWith('+');
          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(data['commodity']!, style: AppTextStyles.h3),
                      Text(
                        data['trend']!,
                        style: TextStyle(
                          color: trendPositive ? Colors.green : Colors.red,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Text('Mandi: ${data['mandi']}'),
                  const Divider(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Modal Price', style: AppTextStyles.caption),
                          Text(data['modal']!, style: AppTextStyles.h2.copyWith(color: AppColors.primary)),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('Govt MSP: ${data['msp']}'),
                          Text('Range: ${data['range']}'),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  CustomButton(
                    text: 'Submit Sell Inquiry',
                    onPressed: () => _submitInquiry(data['commodity']!),
                    width: double.infinity,
                    variant: ButtonVariant.secondary,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
