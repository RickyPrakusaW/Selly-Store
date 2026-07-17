import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:florist_frontend/features/home/domain/product_preview.dart';
import 'package:florist_frontend/features/home/presentation/widgets/product_artwork.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

const _reportsBackground = Color(0xFFF8F9FC);
const _reportsBorder = Color(0xFFECEEF2);

class AdminReportsPage extends StatefulWidget {
  const AdminReportsPage({required this.showMenuButton, super.key});

  final bool showMenuButton;

  @override
  State<AdminReportsPage> createState() => _AdminReportsPageState();
}

class _AdminReportsPageState extends State<AdminReportsPage> {
  var _dateLabel = 'Oct 1, 2023 - Oct 31, 2023';
  var _downloading = false;

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.sizeOf(context).width < 600;

    return ColoredBox(
      color: _reportsBackground,
      child: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
            isMobile ? 12 : 28,
            isMobile ? 16 : 26,
            isMobile ? 12 : 28,
            42,
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1380),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _ReportsHeader(
                    isMobile: isMobile,
                    showMenuButton: widget.showMenuButton,
                    dateLabel: _dateLabel,
                    onDatePressed: _pickDateRange,
                    onDownloadPressed: _downloadReport,
                    downloading: _downloading,
                  ),
                  SizedBox(height: isMobile ? 18 : 26),
                  const _RevenueProfitCard(),
                  const SizedBox(height: 20),
                  const _ReportInsights(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _pickDateRange() async {
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2027),
      initialDateRange: DateTimeRange(
        start: DateTime(2023, 10),
        end: DateTime(2023, 10, 31),
      ),
    );
    if (range != null && mounted) {
      setState(() {
        _dateLabel = '${_shortDate(range.start)} - ${_shortDate(range.end)}';
      });
    }
  }

  String _shortDate(DateTime date) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  Future<void> _downloadReport() async {
    setState(() => _downloading = true);
    await Future<void>.delayed(const Duration(seconds: 1));
    if (!mounted) return;
    setState(() => _downloading = false);
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        const SnackBar(
          content: Text('Laporan berhasil diunduh ke folder Downloads! 📥'),
          behavior: SnackBarBehavior.floating,
        ),
      );
  }
}

class _ReportsHeader extends StatelessWidget {
  const _ReportsHeader({
    required this.isMobile,
    required this.showMenuButton,
    required this.dateLabel,
    required this.onDatePressed,
    required this.onDownloadPressed,
    required this.downloading,
  });

  final bool isMobile;
  final bool showMenuButton;
  final String dateLabel;
  final VoidCallback onDatePressed;
  final VoidCallback onDownloadPressed;
  final bool downloading;

  @override
  Widget build(BuildContext context) {
    final title = Text(
      'Sales & Growth Reports',
      style: Theme.of(context).textTheme.headlineLarge?.copyWith(
        color: AppColors.charcoal,
        fontFamily: 'PlusJakartaSans',
        fontWeight: FontWeight.w700,
      ),
    );
    final dateButton = OutlinedButton.icon(
      key: const ValueKey('reports-date-picker'),
      onPressed: onDatePressed,
      icon: const Icon(LucideIcons.calendarRange, size: 17),
      label: Text(dateLabel, maxLines: 1, overflow: TextOverflow.ellipsis),
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.darkGray,
        side: const BorderSide(color: _reportsBorder),
        minimumSize: const Size(0, 48),
      ),
    );
    final download = OutlinedButton.icon(
      onPressed: downloading ? null : onDownloadPressed,
      icon: downloading
          ? const SizedBox.square(
              dimension: 17,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Icon(LucideIcons.download, size: 17),
      label: Text(downloading ? 'Downloading...' : 'Download Report'),
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.deepRose,
        side: const BorderSide(color: AppColors.primaryPink),
        minimumSize: const Size(0, 48),
      ),
    );

    if (isMobile) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              if (showMenuButton) ...[
                Builder(
                  builder: (context) => IconButton(
                    tooltip: 'Buka navigasi admin',
                    onPressed: () => Scaffold.of(context).openDrawer(),
                    icon: const Icon(LucideIcons.menu),
                  ),
                ),
                const SizedBox(width: 6),
              ],
              Expanded(child: title),
            ],
          ),
          const SizedBox(height: 14),
          dateButton,
          const SizedBox(height: 9),
          download,
        ],
      );
    }

    return Row(
      children: [
        if (showMenuButton) ...[
          Builder(
            builder: (context) => IconButton(
              tooltip: 'Buka navigasi admin',
              onPressed: () => Scaffold.of(context).openDrawer(),
              icon: const Icon(LucideIcons.menu),
            ),
          ),
          const SizedBox(width: 10),
        ],
        Expanded(child: title),
        SizedBox(width: 245, child: dateButton),
        const SizedBox(width: 10),
        download,
      ],
    );
  }
}

class _RevenueProfitCard extends StatelessWidget {
  const _RevenueProfitCard();

  static const _months = ['Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'];
  static const _revenue = [0.50, 0.62, 0.58, 0.75, 0.83, 0.96];
  static const _profit = [0.32, 0.41, 0.37, 0.53, 0.59, 0.70];

  @override
  Widget build(BuildContext context) {
    return _ReportCard(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              runSpacing: 10,
              children: [
                Text(
                  'Monthly Revenue vs Profit',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _LegendDot(color: AppColors.primaryPink, label: 'Revenue'),
                    SizedBox(width: 14),
                    _LegendDot(color: Color(0x66F472B6), label: 'Profit'),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 300,
              child: Row(
                children: [
                  SizedBox(
                    width: 46,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: const [
                        Text('50M'),
                        Text('40M'),
                        Text('30M'),
                        Text('20M'),
                        Text('10M'),
                        Text('0'),
                        SizedBox(height: 24),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Stack(
                      children: [
                        Positioned.fill(
                          bottom: 28,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: List.generate(
                              6,
                              (_) => const Divider(
                                height: 1,
                                color: _reportsBorder,
                              ),
                            ),
                          ),
                        ),
                        Positioned.fill(
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: List.generate(_months.length, (index) {
                              return Expanded(
                                child: Column(
                                  children: [
                                    Expanded(
                                      child: Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        crossAxisAlignment:
                                            CrossAxisAlignment.end,
                                        children: [
                                          _ChartBar(
                                            factor: _revenue[index],
                                            color: AppColors.primaryPink,
                                          ),
                                          const SizedBox(width: 4),
                                          _ChartBar(
                                            factor: _profit[index],
                                            color: const Color(0x66F472B6),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      _months[index],
                                      style: Theme.of(context)
                                          .textTheme
                                          .labelSmall
                                          ?.copyWith(
                                            color: AppColors.mediumGray,
                                          ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChartBar extends StatelessWidget {
  const _ChartBar({required this.factor, required this.color});

  final double factor;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Flexible(
      child: FractionallySizedBox(
        heightFactor: factor,
        child: Container(
          constraints: const BoxConstraints(maxWidth: 22),
          decoration: BoxDecoration(
            color: color,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
          ),
        ),
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 9,
          height: 9,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _ReportInsights extends StatelessWidget {
  const _ReportInsights();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 1000) {
          return const Column(
            children: [
              _TopProductsCard(),
              SizedBox(height: 16),
              _CustomerGrowthCard(),
              SizedBox(height: 16),
              _RentalUtilizationCard(),
            ],
          );
        }
        return const Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: _TopProductsCard()),
            SizedBox(width: 18),
            Expanded(child: _CustomerGrowthCard()),
            SizedBox(width: 18),
            Expanded(child: _RentalUtilizationCard()),
          ],
        );
      },
    );
  }
}

class _TopProductsCard extends StatelessWidget {
  const _TopProductsCard();

  static const _products = [
    (
      ProductPreview(
        name: 'Sweet Romance Bouquet',
        category: 'Bunga',
        price: 325000,
        stockStatus: ProductStockStatus.readyStock,
        visual: ProductVisual.bouquet,
      ),
      '142 Sales',
      'Rp 1.2M',
    ),
    (
      ProductPreview(
        name: 'Peachy Blossom Box',
        category: 'Gift',
        price: 285000,
        stockStatus: ProductStockStatus.readyStock,
        visual: ProductVisual.gift,
      ),
      '118 Sales',
      'Rp 980K',
    ),
    (
      ProductPreview(
        name: 'Papan Rose Garden',
        category: 'Papan',
        price: 875000,
        stockStatus: ProductStockStatus.preOrder,
        visual: ProductVisual.board,
      ),
      '86 Sales',
      'Rp 820K',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return _ReportCard(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Top Selling Products',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            ..._products.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 13),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: SizedBox.square(
                        dimension: 48,
                        child: ProductArtwork(product: item.$1),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.$1.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.labelLarge,
                          ),
                          Text(
                            item.$2,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    Text(
                      item.$3,
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CustomerGrowthCard extends StatelessWidget {
  const _CustomerGrowthCard();

  @override
  Widget build(BuildContext context) {
    return _ReportCard(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Customer Growth Rate',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Text(
                  '+24.5%',
                  style: Theme.of(context).textTheme.displayMedium?.copyWith(
                    color: AppColors.charcoal,
                    fontFamily: 'PlusJakartaSans',
                  ),
                ),
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.readyStockBackground,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Text(
                    'Up',
                    style: TextStyle(
                      color: AppColors.readyStockText,
                      fontSize: 11,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Compared with previous month',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 22),
            Container(
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: AppColors.offWhite,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.userPlus, color: AppColors.deepRose),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '186 Customer Baru',
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                        Text(
                          'Terdaftar bulan ini',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RentalUtilizationCard extends StatelessWidget {
  const _RentalUtilizationCard();

  @override
  Widget build(BuildContext context) {
    return _ReportCard(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Papan Sewa Utilization',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 18),
            Center(
              child: SizedBox.square(
                dimension: 150,
                child: CustomPaint(
                  painter: _DonutPainter(percentage: 0.82),
                  child: const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '82%',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                            color: AppColors.charcoal,
                          ),
                        ),
                        Text(
                          'Active',
                          style: TextStyle(color: AppColors.mediumGray),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const _UtilizationRow(
              color: AppColors.softPink,
              label: 'Available',
              value: '18 Units',
            ),
            const SizedBox(height: 9),
            const _UtilizationRow(
              color: AppColors.deepRose,
              label: 'Rented Out',
              value: '82 Units',
            ),
          ],
        ),
      ),
    );
  }
}

class _DonutPainter extends CustomPainter {
  const _DonutPainter({required this.percentage});

  final double percentage;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.shortestSide / 2 - 12;
    final base = Paint()
      ..color = AppColors.blushRose
      ..style = PaintingStyle.stroke
      ..strokeWidth = 16;
    final active = Paint()
      ..color = AppColors.deepRose
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 16;
    canvas.drawCircle(center, radius, base);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      math.pi * 2 * percentage,
      false,
      active,
    );
  }

  @override
  bool shouldRepaint(covariant _DonutPainter oldDelegate) =>
      oldDelegate.percentage != percentage;
}

class _UtilizationRow extends StatelessWidget {
  const _UtilizationRow({
    required this.color,
    required this.label,
    required this.value,
  });

  final Color color;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 9,
          height: 9,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        Expanded(child: Text(label)),
        Text(value, style: Theme.of(context).textTheme.labelLarge),
      ],
    );
  }
}

class _ReportCard extends StatelessWidget {
  const _ReportCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.pureWhite,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _reportsBorder),
      ),
      child: child,
    );
  }
}
