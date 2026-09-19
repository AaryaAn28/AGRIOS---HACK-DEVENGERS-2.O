class QuizQuestion {
  final String question;
  final List<String> options;
  final int answer;

  QuizQuestion({
    required this.question,
    required this.options,
    required this.answer,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    return QuizQuestion(
      question: json['q']?.toString() ?? '',
      options: (json['options'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      answer: (json['answer'] as num?)?.toInt() ?? 0,
    );
  }
}

class TrainingModuleModel {
  final String id;
  final String title;
  final String crop;
  final String duration;
  final String level;
  final String category;
  final String description;
  final List<QuizQuestion> quiz;

  TrainingModuleModel({
    required this.id,
    required this.title,
    required this.crop,
    required this.duration,
    required this.level,
    required this.category,
    required this.description,
    required this.quiz,
  });

  factory TrainingModuleModel.fromJson(Map<String, dynamic> json) {
    return TrainingModuleModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Course',
      crop: json['crop']?.toString() ?? 'General Agriculture',
      duration: json['duration']?.toString() ?? '30 Mins',
      level: json['level']?.toString() ?? 'Specialist',
      category: json['category']?.toString() ?? 'Agronomy',
      description: json['description']?.toString() ?? '',
      quiz: (json['quiz'] as List<dynamic>?)
              ?.map((q) => QuizQuestion.fromJson(q as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
