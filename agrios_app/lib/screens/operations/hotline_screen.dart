import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../constants/app_text_styles.dart';
import '../../models/hotline_model.dart';
import '../../services/api_service.dart';
import '../../widgets/common_app_bar.dart';
import '../../widgets/custom_button.dart';
import '../reports/official_reports_screen.dart';

class HotlineScreen extends StatefulWidget {
  const HotlineScreen({super.key});

  @override
  State<HotlineScreen> createState() => _HotlineScreenState();
}

class _HotlineScreenState extends State<HotlineScreen> {
  List<HotlineMessageModel> _messages = [];
  bool _isLoading = true;
  final _textController = TextEditingController();
  String _selectedCrop = 'Wheat';
  String _selectedUrgency = 'NORMAL';
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _loadMessages();
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    setState(() => _isLoading = true);
    final msgs = await ApiService().getHotlineMessages();
    if (mounted) {
      setState(() {
        _messages = msgs;
        _isLoading = false;
      });
    }
  }

  Future<void> _handleSendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    _textController.clear();
    setState(() => _isSending = true);

    await ApiService().sendHotlineMessage(_selectedCrop, _selectedUrgency, text);
    await _loadMessages();

    if (mounted) {
      setState(() => _isSending = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✓ Query Transmitted. Dr. Priya Sharma & Botanical AI Triage active.'),
          backgroundColor: AppColors.primary,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CommonAppBar(
        title: 'Agronomist Hotline',
        subtitle: 'Live Bridge with Dr. Priya Sharma & AI Triage',
        actions: [
          IconButton(
            icon: const Icon(Icons.description_outlined, color: Colors.white),
            tooltip: 'Export Transcript',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const OfficialReportsScreen(initialReportType: 'hotline'),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            color: AppColors.infoBg,
            child: Row(
              children: [
                const Icon(Icons.support_agent, color: AppColors.roleAgronomist, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Direct 2-way consultation backed by automated botanical NLP triage.',
                    style: AppTextStyles.caption.copyWith(color: const Color(0xFF0369A1), fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),

          // Messages List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : ListView.builder(
                    padding: const EdgeInsets.all(14),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final m = _messages[index];
                      final isWorker = m.isWorker;
                      final triage = m.mlTriage;

                      return Align(
                        alignment: isWorker ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isWorker ? AppColors.primaryContainer : AppColors.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isWorker ? AppColors.primaryBorder : AppColors.cardBorder,
                            ),
                            boxShadow: AppColors.softShadow,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    m.sender,
                                    style: AppTextStyles.caption.copyWith(
                                      fontWeight: FontWeight.w700,
                                      color: isWorker ? AppColors.primaryDark : AppColors.roleAgronomist,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(m.timestamp, style: AppTextStyles.caption.copyWith(fontSize: 10)),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(m.message, style: AppTextStyles.body),

                              // AI Triage Card if present
                              if (triage != null) ...[
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF0FDF4),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: const Color(0xFFBBF7D0)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '🤖 AI Botanical Triage: ${triage['detected_pathogen'] ?? 'Diagnostic Evaluation'}',
                                        style: AppTextStyles.caption.copyWith(
                                          fontWeight: FontWeight.w700,
                                          color: const Color(0xFF166534),
                                        ),
                                      ),
                                      if (triage['prescriptions'] != null)
                                        Text(
                                          'Rx: ${triage['prescriptions']['chemical'] ?? 'Standard IPM'}',
                                          style: AppTextStyles.caption.copyWith(
                                            color: const Color(0xFF15803d),
                                            fontSize: 11,
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Input Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.cardBorder)),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  Row(
                    children: [
                      DropdownButton<String>(
                        value: _selectedCrop,
                        underline: const SizedBox(),
                        style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                        items: const [
                          DropdownMenuItem(value: 'Wheat', child: Text('Wheat')),
                          DropdownMenuItem(value: 'Rice', child: Text('Rice')),
                          DropdownMenuItem(value: 'Tomato', child: Text('Tomato')),
                          DropdownMenuItem(value: 'Potato', child: Text('Potato')),
                        ],
                        onChanged: (v) {
                          if (v != null) setState(() => _selectedCrop = v);
                        },
                      ),
                      const SizedBox(width: 8),
                      DropdownButton<String>(
                        value: _selectedUrgency,
                        underline: const SizedBox(),
                        style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.w700, color: AppColors.danger),
                        items: const [
                          DropdownMenuItem(value: 'NORMAL', child: Text('Normal Priority')),
                          DropdownMenuItem(value: 'ELEVATED', child: Text('Elevated')),
                          DropdownMenuItem(value: 'CRITICAL', child: Text('🚨 Critical Outbreak')),
                        ],
                        onChanged: (v) {
                          if (v != null) setState(() => _selectedUrgency = v);
                        },
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _textController,
                          decoration: InputDecoration(
                            hintText: 'Type symptoms or ask Dr. Priya Sharma...',
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          style: AppTextStyles.body,
                        ),
                      ),
                      const SizedBox(width: 8),
                      CustomButton(
                        text: 'Send',
                        icon: const Icon(Icons.send, size: 16, color: Colors.white),
                        isLoading: _isSending,
                        width: 90,
                        onPressed: _handleSendMessage,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
