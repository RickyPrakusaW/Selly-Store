import 'package:flutter/material.dart';
import 'package:florist_frontend/core/auth_state.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:florist_frontend/features/admin/presentation/admin_customers_page.dart';
import 'package:florist_frontend/features/admin/presentation/admin_inventory_page.dart';
import 'package:florist_frontend/features/admin/presentation/admin_orders_page.dart';
import 'package:florist_frontend/features/admin/presentation/admin_product_form_page.dart';
import 'package:florist_frontend/features/admin/presentation/admin_reports_page.dart';
import 'package:florist_frontend/features/admin/presentation/admin_settings_page.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

const _adminAvatar = 'assets/images/admin-manager.png';
const _dashboardBackground = Color(0xFFF8F9FC);
const _borderColor = Color(0xFFECEEF2);

class AdminPanelPage extends StatefulWidget {
  const AdminPanelPage({super.key});

  @override
  State<AdminPanelPage> createState() => _AdminPanelPageState();
}

class _AdminPanelPageState extends State<AdminPanelPage> {
  var _selectedSection = 0;
  String? _pendingOrderId;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final showSidebar = constraints.maxWidth >= 980;

        return Scaffold(
          backgroundColor: _dashboardBackground,
          drawer: showSidebar
              ? null
              : Drawer(
                  width: 260,
                  child: _AdminSidebar(
                    selectedIndex: _selectedSection,
                    closeOnSelect: true,
                    onSelected: _selectSection,
                    onNewProduct: _openNewProduct,
                  ),
                ),
          body: Row(
            children: [
              if (showSidebar)
                SizedBox(
                  width: 260,
                  child: _AdminSidebar(
                    selectedIndex: _selectedSection,
                    onSelected: _selectSection,
                    onNewProduct: _openNewProduct,
                  ),
                ),
              Expanded(child: _buildSection(showMenuButton: !showSidebar)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSection({required bool showMenuButton}) {
    return switch (_selectedSection) {
      1 => AdminOrdersPage(
        showMenuButton: showMenuButton,
        initialOrderId: _pendingOrderId,
      ),
      2 => AdminInventoryPage(showMenuButton: showMenuButton),
      3 => AdminCustomersPage(showMenuButton: showMenuButton),
      4 => AdminReportsPage(showMenuButton: showMenuButton),
      5 => AdminSettingsPage(showMenuButton: showMenuButton),
      _ => _DashboardContent(
        showMenuButton: showMenuButton,
        onOpenOrder: _openOrder,
      ),
    };
  }

  void _selectSection(int index) {
    setState(() {
      _selectedSection = index;
      _pendingOrderId = null;
    });
  }

  void _openOrder(String orderId) {
    setState(() {
      _pendingOrderId = orderId;
      _selectedSection = 1;
    });
  }

  Future<void> _openNewProduct() async {
    await Navigator.push<void>(
      context,
      MaterialPageRoute(builder: (_) => const AdminProductFormPage()),
    );
  }
}

class _AdminSidebar extends StatelessWidget {
  const _AdminSidebar({
    required this.selectedIndex,
    required this.onSelected,
    required this.onNewProduct,
    this.closeOnSelect = false,
  });

  final int selectedIndex;
  final ValueChanged<int> onSelected;
  final VoidCallback onNewProduct;
  final bool closeOnSelect;

  static const _items = [
    ('Dashboard', LucideIcons.layoutDashboard),
    ('Orders', LucideIcons.shoppingBag),
    ('Inventory', LucideIcons.packageOpen),
    ('Customers', LucideIcons.users),
    ('Reports', LucideIcons.chartNoAxesCombined),
    ('Settings', LucideIcons.settings),
  ];

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.pureWhite,
      child: DecoratedBox(
        decoration: const BoxDecoration(
          border: Border(right: BorderSide(color: _borderColor)),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 28, 18, 22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const _SidebarProfile(),
                const SizedBox(height: 34),
                Text(
                  'MENU',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.mediumGray,
                    letterSpacing: 1.4,
                  ),
                ),
                const SizedBox(height: 10),
                ..._items.indexed.map(
                  (entry) => Padding(
                    padding: const EdgeInsets.only(bottom: 7),
                    child: _SidebarNavItem(
                      label: entry.$2.$1,
                      icon: entry.$2.$2,
                      isActive: entry.$1 == selectedIndex,
                      onTap: () => _handleSelection(context, entry.$1),
                    ),
                  ),
                ),
                const Spacer(),
                FilledButton.icon(
                  key: const ValueKey('new-product-button'),
                  onPressed: () {
                    if (closeOnSelect) {
                      Navigator.of(context).pop();
                    }
                    onNewProduct();
                  },
                  icon: const Icon(LucideIcons.plus, size: 18),
                  label: const Text('New Product'),
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(50),
                    backgroundColor: AppColors.deepRose,
                    foregroundColor: AppColors.pureWhite,
                    shape: const StadiumBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  icon: const Icon(LucideIcons.arrowLeftRight, size: 18),
                  label: const Text('Kembali ke Toko'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(50),
                    foregroundColor: AppColors.darkGray,
                    side: const BorderSide(color: _borderColor),
                    shape: const StadiumBorder(),
                  ),
                ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: () async {
                    try {
                      await authNotifier.logout();
                    } catch (_) {
                      // Local credentials are cleared even if revocation fails.
                    }
                    if (!context.mounted) return;
                    Navigator.of(context).pop();
                  },
                  icon: const Icon(LucideIcons.logOut, size: 18),
                  label: const Text('Keluar Akun'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(50),
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error),
                    shape: const StadiumBorder(),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _handleSelection(BuildContext context, int index) {
    if (closeOnSelect) {
      Navigator.of(context).pop();
    }
    onSelected(index);
  }
}

class _SidebarProfile extends StatelessWidget {
  const _SidebarProfile();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const _ProfileAvatar(size: 52),
        const SizedBox(width: 13),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Seli Admin',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: AppColors.charcoal,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                'Florist Manager',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: AppColors.mediumGray),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SidebarNavItem extends StatelessWidget {
  const _SidebarNavItem({
    required this.label,
    required this.icon,
    required this.isActive,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final foreground = isActive ? AppColors.pureWhite : AppColors.darkGray;

    return Material(
      color: isActive ? AppColors.primaryPink : Colors.transparent,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: isActive ? null : onTap,
        borderRadius: BorderRadius.circular(12),
        hoverColor: isActive ? null : AppColors.offWhite,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          child: Row(
            children: [
              Icon(icon, size: 20, color: foreground),
              const SizedBox(width: 13),
              Text(
                label,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: foreground,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DashboardContent extends StatelessWidget {
  const _DashboardContent({
    required this.showMenuButton,
    required this.onOpenOrder,
  });

  final bool showMenuButton;
  final ValueChanged<String> onOpenOrder;

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.sizeOf(context).width < 600;

    return SafeArea(
      child: Column(
        children: [
          _DashboardTopBar(showMenuButton: showMenuButton),
          const Divider(height: 1, color: _borderColor),
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                isMobile ? 12 : 28,
                isMobile ? 16 : 28,
                isMobile ? 12 : 28,
                44,
              ),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 1440),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const _KpiGrid(),
                      const SizedBox(height: 24),
                      _MiddleDataSection(onVerify: onOpenOrder),
                      const SizedBox(height: 24),
                      const _FinancialLedger(),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DashboardTopBar extends StatelessWidget {
  const _DashboardTopBar({required this.showMenuButton});

  final bool showMenuButton;

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.sizeOf(context).width < 600;

    return Container(
      height: isMobile ? 72 : 84,
      color: AppColors.pureWhite,
      padding: EdgeInsets.symmetric(horizontal: isMobile ? 12 : 28),
      child: Row(
        children: [
          if (showMenuButton) ...[
            Builder(
              builder: (context) => IconButton(
                tooltip: 'Buka navigasi admin',
                onPressed: () => Scaffold.of(context).openDrawer(),
                icon: const Icon(LucideIcons.menu),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: Text(
              'Dashboard Overview',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                color: AppColors.charcoal,
                fontFamily: 'PlusJakartaSans',
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Stack(
            clipBehavior: Clip.none,
            children: [
              IconButton(
                tooltip: 'Notifikasi',
                onPressed: () =>
                    _showComingSoon(context, 'Tidak ada notifikasi baru.'),
                icon: const Icon(LucideIcons.bell, size: 22),
              ),
              const Positioned(
                top: 10,
                right: 10,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: AppColors.error,
                    shape: BoxShape.circle,
                  ),
                  child: SizedBox.square(dimension: 8),
                ),
              ),
            ],
          ),
          if (!isMobile) ...[
            const SizedBox(width: 14),
            Container(width: 1, height: 34, color: _borderColor),
            const SizedBox(width: 18),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  'Admin User',
                  style: Theme.of(
                    context,
                  ).textTheme.labelLarge?.copyWith(color: AppColors.charcoal),
                ),
                const SizedBox(height: 2),
                Text(
                  'admin@seliflorist.com',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
            const SizedBox(width: 12),
            const _ProfileAvatar(size: 42),
          ],
        ],
      ),
    );
  }
}

class _ProfileAvatar extends StatelessWidget {
  const _ProfileAvatar({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      padding: const EdgeInsets.all(2),
      decoration: const BoxDecoration(
        color: AppColors.blushRose,
        shape: BoxShape.circle,
      ),
      child: ClipOval(
        child: Image.asset(
          _adminAvatar,
          fit: BoxFit.cover,
          alignment: const Alignment(0, -0.1),
        ),
      ),
    );
  }
}

class _KpiGrid extends StatelessWidget {
  const _KpiGrid();

  static const _cards = [
    _KpiData(
      title: 'Total Revenue',
      subtitle: 'This Month',
      value: 'Rp 45.2M',
      trend: '+12.5%',
      icon: LucideIcons.walletCards,
      accent: AppColors.deepRose,
      iconBackground: AppColors.blushRose,
      trendType: _TrendType.positive,
    ),
    _KpiData(
      title: 'New Orders',
      subtitle: 'Today',
      value: '124',
      trend: '+8.2%',
      icon: LucideIcons.shoppingBag,
      accent: Color(0xFF7C3AED),
      iconBackground: Color(0xFFF0EAFE),
      trendType: _TrendType.positive,
    ),
    _KpiData(
      title: 'Active Papan Sewa',
      subtitle: 'Current rentals',
      value: '32',
      trend: 'Steady',
      icon: LucideIcons.panelTop,
      accent: Color(0xFF2563EB),
      iconBackground: Color(0xFFE8F0FF),
      trendType: _TrendType.neutral,
    ),
    _KpiData(
      title: 'Low Stock Items',
      subtitle: 'Inventory alert',
      value: '8',
      trend: 'Needs Action',
      icon: LucideIcons.triangleAlert,
      accent: AppColors.error,
      iconBackground: Color(0xFFFFE9E9),
      trendType: _TrendType.negative,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isMobile = MediaQuery.sizeOf(context).width < 600;
        final columns = isMobile
            ? 2
            : constraints.maxWidth >= 900
            ? 4
            : constraints.maxWidth >= 620
            ? 2
            : 1;
        final gap = isMobile ? 10.0 : 18.0;
        final width = (constraints.maxWidth - gap * (columns - 1)) / columns;

        return Wrap(
          spacing: gap,
          runSpacing: gap,
          children: _cards
              .map(
                (data) => SizedBox(
                  width: width,
                  child: _KpiCard(data: data, isCompact: isMobile),
                ),
              )
              .toList(),
        );
      },
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({required this.data, required this.isCompact});

  final _KpiData data;
  final bool isCompact;

  @override
  Widget build(BuildContext context) {
    return _DashboardCard(
      child: SizedBox(
        height: isCompact ? 104 : null,
        child: Padding(
          padding: EdgeInsets.all(isCompact ? 12 : 20),
          child: isCompact
              ? _CompactKpiContent(data: data)
              : _DesktopKpiContent(data: data),
        ),
      ),
    );
  }
}

class _CompactKpiContent extends StatelessWidget {
  const _CompactKpiContent({required this.data});

  final _KpiData data;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: data.iconBackground,
                borderRadius: BorderRadius.circular(11),
              ),
              alignment: Alignment.center,
              child: Icon(data.icon, size: 17, color: data.accent),
            ),
            const SizedBox(width: 9),
            Expanded(
              child: Text(
                data.value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: AppColors.charcoal,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        const Spacer(),
        Text(
          data.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: AppColors.darkGray,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}

class _DesktopKpiContent extends StatelessWidget {
  const _DesktopKpiContent({required this.data});

  final _KpiData data;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: data.iconBackground,
                borderRadius: BorderRadius.circular(13),
              ),
              alignment: Alignment.center,
              child: Icon(data.icon, size: 21, color: data.accent),
            ),
            const Spacer(),
            _TrendBadge(label: data.trend, type: data.trendType),
          ],
        ),
        const SizedBox(height: 22),
        Text(
          data.value,
          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
            color: AppColors.charcoal,
            fontFamily: 'PlusJakartaSans',
            fontSize: 27,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          data.title,
          style: Theme.of(
            context,
          ).textTheme.labelLarge?.copyWith(color: AppColors.darkGray),
        ),
        const SizedBox(height: 2),
        Text(data.subtitle, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _TrendBadge extends StatelessWidget {
  const _TrendBadge({required this.label, required this.type});

  final String label;
  final _TrendType type;

  @override
  Widget build(BuildContext context) {
    final (background, foreground) = switch (type) {
      _TrendType.positive => (const Color(0xFFE7F8EF), AppColors.success),
      _TrendType.neutral => (AppColors.lightGray, AppColors.mediumGray),
      _TrendType.negative => (const Color(0xFFFFE9E9), AppColors.error),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: foreground,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _MiddleDataSection extends StatelessWidget {
  const _MiddleDataSection({required this.onVerify});

  final ValueChanged<String> onVerify;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final useColumns = constraints.maxWidth >= 900;
        const chart = _RevenueChartCard();
        final queue = _VerificationQueueCard(onVerify: onVerify);

        if (!useColumns) {
          return Column(children: [chart, const SizedBox(height: 18), queue]);
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Expanded(flex: 7, child: chart),
            const SizedBox(width: 18),
            Expanded(flex: 3, child: queue),
          ],
        );
      },
    );
  }
}

class _RevenueChartCard extends StatelessWidget {
  const _RevenueChartCard();

  static const _labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  static const _values = [0.48, 0.72, 0.57, 0.88, 0.68, 0.96, 0.81];

  @override
  Widget build(BuildContext context) {
    return _DashboardCard(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(22, 22, 22, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Omzet 7 Hari Terakhir',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.charcoal,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const _ChartPeriodSwitch(),
              ],
            ),
            const SizedBox(height: 28),
            SizedBox(
              height: 270,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(
                    width: 44,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: const [
                        Text('10M'),
                        Text('7.5M'),
                        Text('5M'),
                        Text('2.5M'),
                        Text('0'),
                        SizedBox(height: 24),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Stack(
                      children: [
                        Positioned.fill(
                          bottom: 28,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: List.generate(
                              5,
                              (_) =>
                                  const Divider(height: 1, color: _borderColor),
                            ),
                          ),
                        ),
                        Positioned.fill(
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: List.generate(_labels.length, (index) {
                              return Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                  ),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      Expanded(
                                        child: Align(
                                          alignment: Alignment.bottomCenter,
                                          child: FractionallySizedBox(
                                            heightFactor: _values[index],
                                            child: Container(
                                              constraints: const BoxConstraints(
                                                maxWidth: 34,
                                              ),
                                              decoration: BoxDecoration(
                                                gradient: const LinearGradient(
                                                  begin: Alignment.topCenter,
                                                  end: Alignment.bottomCenter,
                                                  colors: [
                                                    AppColors.primaryPink,
                                                    AppColors.deepRose,
                                                  ],
                                                ),
                                                borderRadius:
                                                    BorderRadius.circular(8),
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 9),
                                      Text(
                                        _labels[index],
                                        style: Theme.of(context)
                                            .textTheme
                                            .labelSmall
                                            ?.copyWith(
                                              color: AppColors.mediumGray,
                                            ),
                                      ),
                                    ],
                                  ),
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

class _ChartPeriodSwitch extends StatelessWidget {
  const _ChartPeriodSwitch();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: AppColors.lightGray,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: AppColors.primaryPink,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'Week',
              style: Theme.of(
                context,
              ).textTheme.labelSmall?.copyWith(color: AppColors.pureWhite),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              'Month',
              style: Theme.of(
                context,
              ).textTheme.labelSmall?.copyWith(color: AppColors.mediumGray),
            ),
          ),
        ],
      ),
    );
  }
}

class _VerificationQueueCard extends StatelessWidget {
  const _VerificationQueueCard({required this.onVerify});

  final ValueChanged<String> onVerify;

  static const _items = [
    ('#ORD-9921', '10 mins ago', 'Buket Mawar Blush', 'Rp 450.000'),
    ('#ORD-9918', '24 mins ago', 'Papan Rose Garden', 'Rp 875.000'),
    ('#ORD-9912', '42 mins ago', 'Gift Box Sweet Moment', 'Rp 320.000'),
  ];

  @override
  Widget build(BuildContext context) {
    return _DashboardCard(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Antrian Verifikasi',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.charcoal,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.blushRose,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '5 Pending',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.deepRose,
                      fontSize: 10,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            ..._items.indexed.map(
              (entry) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: _dashboardBackground,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: _borderColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              entry.$2.$1,
                              style: Theme.of(context).textTheme.labelLarge
                                  ?.copyWith(color: AppColors.deepRose),
                            ),
                          ),
                          Text(
                            entry.$2.$2,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                      const SizedBox(height: 9),
                      Text(
                        entry.$2.$3,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        entry.$2.$4,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: AppColors.charcoal,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          onPressed: () => onVerify(
                            entry.$1 == 0 ? '#ORD-0982' : '#ORD-0981',
                          ),
                          icon: const Icon(LucideIcons.badgeCheck, size: 16),
                          label: const Text('Verify'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FinancialLedger extends StatefulWidget {
  const _FinancialLedger();

  @override
  State<_FinancialLedger> createState() => _FinancialLedgerState();
}

class _FinancialLedgerState extends State<_FinancialLedger> {
  var _exporting = false;

  static const _rows = [
    ('18 Jul 2026', 'Pelunasan ORD-9921', 'Sales', '+Rp 2.250.000', true, true),
    (
      '18 Jul 2026',
      'Restock bunga impor',
      'Inventory',
      '-Rp 1.500.000',
      false,
      true,
    ),
    (
      '17 Jul 2026',
      'DP Papan Rose Garden',
      'Rental',
      '+Rp 875.000',
      true,
      false,
    ),
    (
      '17 Jul 2026',
      'Biaya kurir lokal',
      'Operations',
      '-Rp 320.000',
      false,
      true,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return _DashboardCard(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(22, 22, 22, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Wrap(
              spacing: 18,
              runSpacing: 14,
              crossAxisAlignment: WrapCrossAlignment.center,
              alignment: WrapAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Laporan Keuangan',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: AppColors.charcoal,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      'Ringkasan transaksi harian terbaru',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                OutlinedButton.icon(
                  onPressed: _exporting ? null : _exportReport,
                  icon: _exporting
                      ? const SizedBox.square(
                          dimension: 17,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(LucideIcons.download, size: 17),
                  label: Text(_exporting ? 'Exporting...' : 'Export XLSX'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.deepRose,
                    side: const BorderSide(color: AppColors.deepRose),
                    shape: const StadiumBorder(),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Divider(height: 1, color: _borderColor),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingRowHeight: 50,
                dataRowMinHeight: 58,
                dataRowMaxHeight: 58,
                horizontalMargin: 12,
                columnSpacing: 44,
                dividerThickness: 0.7,
                headingTextStyle: Theme.of(context).textTheme.labelSmall
                    ?.copyWith(
                      color: AppColors.mediumGray,
                      fontSize: 10,
                      letterSpacing: 0.8,
                    ),
                columns: const [
                  DataColumn(label: Text('DATE')),
                  DataColumn(label: Text('DESCRIPTION')),
                  DataColumn(label: Text('CATEGORY')),
                  DataColumn(label: Text('AMOUNT')),
                  DataColumn(label: Text('STATUS')),
                ],
                rows: _rows
                    .map(
                      (row) => DataRow(
                        cells: [
                          DataCell(Text(row.$1)),
                          DataCell(SizedBox(width: 210, child: Text(row.$2))),
                          DataCell(Text(row.$3)),
                          DataCell(
                            Text(
                              row.$4,
                              style: Theme.of(context).textTheme.labelLarge
                                  ?.copyWith(
                                    color: row.$5
                                        ? AppColors.success
                                        : AppColors.error,
                                  ),
                            ),
                          ),
                          DataCell(_StatusBadge(completed: row.$6)),
                        ],
                      ),
                    )
                    .toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _exportReport() async {
    setState(() => _exporting = true);
    await Future<void>.delayed(const Duration(seconds: 1));
    if (!mounted) return;
    setState(() => _exporting = false);
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

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.completed});

  final bool completed;

  @override
  Widget build(BuildContext context) {
    final background = completed
        ? const Color(0xFFE7F8EF)
        : const Color(0xFFFFF4D6);
    final foreground = completed ? AppColors.success : AppColors.warning;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        completed ? 'Completed' : 'Pending',
        style: Theme.of(
          context,
        ).textTheme.labelSmall?.copyWith(color: foreground, fontSize: 10),
      ),
    );
  }
}

class _DashboardCard extends StatelessWidget {
  const _DashboardCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.pureWhite,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _borderColor),
        boxShadow: const [
          BoxShadow(
            color: Color(0x080F172A),
            blurRadius: 18,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: child,
    );
  }
}

enum _TrendType { positive, neutral, negative }

class _KpiData {
  const _KpiData({
    required this.title,
    required this.subtitle,
    required this.value,
    required this.trend,
    required this.icon,
    required this.accent,
    required this.iconBackground,
    required this.trendType,
  });

  final String title;
  final String subtitle;
  final String value;
  final String trend;
  final IconData icon;
  final Color accent;
  final Color iconBackground;
  final _TrendType trendType;
}

void _showComingSoon(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
}
