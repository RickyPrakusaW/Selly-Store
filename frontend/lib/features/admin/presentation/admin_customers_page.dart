import 'package:flutter/material.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

const _customerBackground = Color(0xFFF8F9FC);
const _customerBorder = Color(0xFFECEEF2);

class AdminCustomersPage extends StatefulWidget {
  const AdminCustomersPage({required this.showMenuButton, super.key});

  final bool showMenuButton;

  @override
  State<AdminCustomersPage> createState() => _AdminCustomersPageState();
}

class _AdminCustomersPageState extends State<AdminCustomersPage> {
  static const _initialCustomers = [
    _CustomerData(
      initials: 'SW',
      name: 'Sarah Wijaya',
      joined: 'Joined 12 Jan 2023',
      email: 'sarah.wijaya@email.com',
      phone: '0812 3456 7890',
      orders: 18,
      spend: 'Rp 4.500.000',
      active: true,
      avatarColor: Color(0xFFF9A8D4),
    ),
    _CustomerData(
      initials: 'BS',
      name: 'Budi Santoso',
      joined: 'Joined 28 Feb 2023',
      email: 'budi.santoso@email.com',
      phone: '0813 7788 9900',
      orders: 9,
      spend: 'Rp 2.750.000',
      active: true,
      avatarColor: Color(0xFFA5B4FC),
    ),
    _CustomerData(
      initials: 'AR',
      name: 'Amanda Rizky',
      joined: 'Joined 04 Apr 2023',
      email: 'amanda.rizky@email.com',
      phone: '0857 2211 3344',
      orders: 7,
      spend: 'Rp 1.980.000',
      active: false,
      avatarColor: Color(0xFFFDBA74),
    ),
    _CustomerData(
      initials: 'DN',
      name: 'Dewi Natalia',
      joined: 'Joined 19 Jun 2023',
      email: 'dewi.natalia@email.com',
      phone: '0821 4466 8800',
      orders: 12,
      spend: 'Rp 3.625.000',
      active: true,
      avatarColor: Color(0xFF86EFAC),
    ),
  ];

  late final List<_CustomerData> _customers = List.of(_initialCustomers);
  var _query = '';

  List<_CustomerData> get _filteredCustomers {
    final query = _query.trim().toLowerCase();
    if (query.isEmpty) return _customers;
    return _customers
        .where(
          (customer) =>
              customer.name.toLowerCase().contains(query) ||
              customer.email.toLowerCase().contains(query) ||
              customer.phone.contains(query),
        )
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.sizeOf(context).width < 600;

    return ColoredBox(
      color: _customerBackground,
      child: SafeArea(
        child: Column(
          children: [
            _CustomerHeader(
              isMobile: isMobile,
              showMenuButton: widget.showMenuButton,
              onAddCustomer: _showAddCustomerDialog,
              onSearchChanged: (value) => setState(() => _query = value),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.fromLTRB(
                  isMobile ? 12 : 28,
                  isMobile ? 14 : 24,
                  isMobile ? 12 : 28,
                  36,
                ),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 1320),
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.pureWhite,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: _customerBorder),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (isMobile)
                            _MobileCustomerList(customers: _filteredCustomers)
                          else
                            _CustomerTable(customers: _filteredCustomers),
                          const Divider(height: 1, color: _customerBorder),
                          const _CustomerPagination(),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showAddCustomerDialog() async {
    final name = TextEditingController();
    final email = TextEditingController();
    final phone = TextEditingController();
    final formKey = GlobalKey<FormState>();
    final saved = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Add New Customer'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  key: const ValueKey('new-customer-name'),
                  controller: name,
                  decoration: const InputDecoration(labelText: 'Nama'),
                  validator: _required,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  key: const ValueKey('new-customer-email'),
                  controller: email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email'),
                  validator: _required,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  key: const ValueKey('new-customer-phone'),
                  controller: phone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'No WA'),
                  validator: _required,
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            key: const ValueKey('save-new-customer'),
            onPressed: () {
              if (formKey.currentState!.validate()) {
                Navigator.pop(dialogContext, true);
              }
            },
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
    if (saved == true && mounted) {
      final parts = name.text.trim().split(RegExp(r'\s+'));
      final initials = parts
          .take(2)
          .map((part) => part.isEmpty ? '' : part[0].toUpperCase())
          .join();
      setState(() {
        _customers.insert(
          0,
          _CustomerData(
            initials: initials.isEmpty ? 'CU' : initials,
            name: name.text.trim(),
            joined: 'Joined Today',
            email: email.text.trim(),
            phone: phone.text.trim(),
            orders: 0,
            spend: 'Rp 0',
            active: true,
            avatarColor: AppColors.softPink,
          ),
        );
      });
    }
    name.dispose();
    email.dispose();
    phone.dispose();
  }

  static String? _required(String? value) =>
      value == null || value.trim().isEmpty ? 'Wajib diisi' : null;
}

class _CustomerHeader extends StatelessWidget {
  const _CustomerHeader({
    required this.isMobile,
    required this.showMenuButton,
    required this.onAddCustomer,
    required this.onSearchChanged,
  });

  final bool isMobile;
  final bool showMenuButton;
  final VoidCallback onAddCustomer;
  final ValueChanged<String> onSearchChanged;

  @override
  Widget build(BuildContext context) {
    final title = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Customer Database',
          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
            color: AppColors.charcoal,
            fontFamily: 'PlusJakartaSans',
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 5),
        Text(
          'Kelola profil dan riwayat pelanggan Seli Florist.',
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: AppColors.mediumGray),
        ),
      ],
    );
    final search = TextField(
      onChanged: onSearchChanged,
      decoration: InputDecoration(
        hintText: 'Search customers...',
        prefixIcon: const Icon(LucideIcons.search, size: 19),
        filled: true,
        fillColor: _customerBackground,
        contentPadding: const EdgeInsets.symmetric(vertical: 12),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _customerBorder),
        ),
      ),
    );
    final addButton = FilledButton.icon(
      onPressed: onAddCustomer,
      icon: const Icon(LucideIcons.userPlus, size: 18),
      label: const Text('Add New Customer'),
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.primaryPink,
        minimumSize: Size(isMobile ? double.infinity : 180, 48),
      ),
    );

    return Container(
      color: AppColors.pureWhite,
      padding: EdgeInsets.fromLTRB(
        isMobile ? 12 : 28,
        isMobile ? 16 : 22,
        isMobile ? 12 : 28,
        isMobile ? 16 : 22,
      ),
      child: isMobile
          ? Column(
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
                search,
                const SizedBox(height: 10),
                addButton,
              ],
            )
          : Row(
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
                const SizedBox(width: 20),
                SizedBox(width: 280, child: search),
                const SizedBox(width: 12),
                addButton,
              ],
            ),
    );
  }
}

class _CustomerTable extends StatelessWidget {
  const _CustomerTable({required this.customers});

  final List<_CustomerData> customers;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingRowHeight: 54,
        dataRowMinHeight: 78,
        dataRowMaxHeight: 78,
        horizontalMargin: 22,
        columnSpacing: 42,
        headingTextStyle: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: AppColors.mediumGray,
          fontSize: 10,
          letterSpacing: 0.7,
        ),
        columns: const [
          DataColumn(label: Text('PROFILE')),
          DataColumn(label: Text('CONTACT INFO')),
          DataColumn(label: Text('ORDERS')),
          DataColumn(label: Text('TOTAL SPEND')),
          DataColumn(label: Text('STATUS')),
          DataColumn(label: Text('ACTIONS')),
        ],
        rows: customers
            .map(
              (customer) => DataRow(
                cells: [
                  DataCell(
                    SizedBox(
                      width: 230,
                      child: Row(
                        children: [
                          _CustomerAvatar(customer: customer, size: 46),
                          const SizedBox(width: 11),
                          Expanded(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  customer.name,
                                  style: Theme.of(context).textTheme.labelLarge,
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  customer.joined,
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  DataCell(
                    SizedBox(
                      width: 220,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(customer.email),
                          const SizedBox(height: 3),
                          Text(
                            customer.phone,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ),
                  DataCell(Text('${customer.orders} orders')),
                  DataCell(
                    Text(
                      customer.spend,
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                  ),
                  DataCell(_CustomerStatusBadge(active: customer.active)),
                  DataCell(
                    IconButton(
                      tooltip: 'Aksi customer',
                      onPressed: () {},
                      icon: const Icon(LucideIcons.ellipsis, size: 19),
                    ),
                  ),
                ],
              ),
            )
            .toList(),
      ),
    );
  }
}

class _MobileCustomerList extends StatelessWidget {
  const _MobileCustomerList({required this.customers});

  final List<_CustomerData> customers;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: customers
            .map(
              (customer) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _customerBackground,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: _customerBorder),
                ),
                child: Row(
                  children: [
                    _CustomerAvatar(customer: customer, size: 46),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            customer.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.labelLarge,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            customer.email,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            customer.phone,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 90,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            customer.spend,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.labelSmall
                                ?.copyWith(color: AppColors.charcoal),
                          ),
                          const SizedBox(height: 7),
                          _CustomerStatusBadge(active: customer.active),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class _CustomerAvatar extends StatelessWidget {
  const _CustomerAvatar({required this.customer, required this.size});

  final _CustomerData customer;
  final double size;

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: size / 2,
      backgroundColor: customer.avatarColor,
      child: Text(
        customer.initials,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
          color: AppColors.charcoal,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _CustomerStatusBadge extends StatelessWidget {
  const _CustomerStatusBadge({required this.active});

  final bool active;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: active ? AppColors.readyStockBackground : AppColors.lightGray,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        active ? 'Active' : 'Inactive',
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: active ? AppColors.readyStockText : AppColors.mediumGray,
          fontSize: 10,
        ),
      ),
    );
  }
}

class _CustomerPagination extends StatelessWidget {
  const _CustomerPagination();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: const [
          _PageButton(label: '‹'),
          SizedBox(width: 5),
          _PageButton(label: '1', selected: true),
          SizedBox(width: 5),
          _PageButton(label: '2'),
          SizedBox(width: 5),
          _PageButton(label: '3'),
          SizedBox(width: 5),
          _PageButton(label: '›'),
        ],
      ),
    );
  }
}

class _PageButton extends StatelessWidget {
  const _PageButton({required this.label, this.selected = false});

  final String label;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 34,
      height: 34,
      decoration: BoxDecoration(
        color: selected ? AppColors.primaryPink : AppColors.pureWhite,
        borderRadius: BorderRadius.circular(9),
        border: Border.all(
          color: selected ? AppColors.primaryPink : _customerBorder,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
          color: selected ? AppColors.pureWhite : AppColors.darkGray,
        ),
      ),
    );
  }
}

class _CustomerData {
  const _CustomerData({
    required this.initials,
    required this.name,
    required this.joined,
    required this.email,
    required this.phone,
    required this.orders,
    required this.spend,
    required this.active,
    required this.avatarColor,
  });

  final String initials;
  final String name;
  final String joined;
  final String email;
  final String phone;
  final int orders;
  final String spend;
  final bool active;
  final Color avatarColor;
}
