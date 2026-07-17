import 'package:flutter/material.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

const _settingsBackground = Color(0xFFF8F9FC);
const _settingsBorder = Color(0xFFECEEF2);

class AdminSettingsPage extends StatefulWidget {
  const AdminSettingsPage({required this.showMenuButton, super.key});

  final bool showMenuButton;

  @override
  State<AdminSettingsPage> createState() => _AdminSettingsPageState();
}

class _AdminSettingsPageState extends State<AdminSettingsPage> {
  final _formKey = GlobalKey<FormState>();
  final _storeName = TextEditingController(text: 'Seli Florist');
  final _whatsApp = TextEditingController(text: '6281234567890');
  final _address = TextEditingController(
    text: 'Jl. Melati Indah No. 18, Bandung',
  );
  final _baseFee = TextEditingController(text: '15000');
  final _perKmFee = TextEditingController(text: '3000');
  final _minimumDp = TextEditingController(text: '50');
  var _deliveryRadius = 15.0;
  var _paymentDeadline = 24;
  var _taxEnabled = false;
  var _saving = false;

  @override
  void dispose() {
    _storeName.dispose();
    _whatsApp.dispose();
    _address.dispose();
    _baseFee.dispose();
    _perKmFee.dispose();
    _minimumDp.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.sizeOf(context).width < 600;

    return ColoredBox(
      color: _settingsBackground,
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
              constraints: const BoxConstraints(maxWidth: 1320),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _SettingsHeader(
                      isMobile: isMobile,
                      showMenuButton: widget.showMenuButton,
                      onSave: _saveChanges,
                      saving: _saving,
                    ),
                    SizedBox(height: isMobile ? 18 : 26),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final useColumns = constraints.maxWidth >= 900;
                        final left = Column(
                          children: [
                            _StoreProfileCard(
                              storeName: _storeName,
                              whatsApp: _whatsApp,
                              address: _address,
                              onLogoPressed: _simulateLogoUpload,
                            ),
                            const SizedBox(height: 18),
                            _DeliverySettingsCard(
                              baseFee: _baseFee,
                              perKmFee: _perKmFee,
                              radius: _deliveryRadius,
                              onRadiusChanged: (value) {
                                setState(() => _deliveryRadius = value);
                              },
                            ),
                          ],
                        );
                        final right = Column(
                          children: [
                            _TransactionLogicCard(
                              minimumDp: _minimumDp,
                              paymentDeadline: _paymentDeadline,
                              taxEnabled: _taxEnabled,
                              onDeadlineChanged: (value) {
                                setState(() => _paymentDeadline = value);
                              },
                              onTaxChanged: (value) {
                                setState(() => _taxEnabled = value);
                              },
                            ),
                            const SizedBox(height: 18),
                            _NeedHelpCard(onPressed: _contactSupport),
                          ],
                        );

                        if (!useColumns) {
                          return Column(
                            children: [left, const SizedBox(height: 18), right],
                          );
                        }
                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(child: left),
                            const SizedBox(width: 20),
                            Expanded(child: right),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _saving = true);
    await Future<void>.delayed(const Duration(seconds: 1));
    if (!mounted) return;
    setState(() => _saving = false);
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        const SnackBar(
          content: Text('Pengaturan toko berhasil diperbarui! 💾'),
          behavior: SnackBarBehavior.floating,
        ),
      );
  }

  void _simulateLogoUpload() => _showMessage('Pemilih logo toko dibuka.');

  void _contactSupport() =>
      _showMessage('Menghubungkan ke tim support Seli Florist.');

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
      );
  }
}

class _SettingsHeader extends StatelessWidget {
  const _SettingsHeader({
    required this.isMobile,
    required this.showMenuButton,
    required this.onSave,
    required this.saving,
  });

  final bool isMobile;
  final bool showMenuButton;
  final VoidCallback onSave;
  final bool saving;

  @override
  Widget build(BuildContext context) {
    final title = Text(
      'Store Settings',
      style: Theme.of(context).textTheme.headlineLarge?.copyWith(
        color: AppColors.charcoal,
        fontFamily: 'PlusJakartaSans',
        fontWeight: FontWeight.w700,
      ),
    );
    final saveButton = FilledButton.icon(
      key: const ValueKey('save-store-settings'),
      onPressed: saving ? null : onSave,
      icon: saving
          ? const SizedBox.square(
              dimension: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Icon(LucideIcons.save, size: 18),
      label: Text(saving ? 'Saving...' : 'Save Changes'),
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.primaryPink,
        minimumSize: Size(isMobile ? double.infinity : 160, 48),
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
          saveButton,
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
        saveButton,
      ],
    );
  }
}

class _StoreProfileCard extends StatelessWidget {
  const _StoreProfileCard({
    required this.storeName,
    required this.whatsApp,
    required this.address,
    required this.onLogoPressed,
  });

  final TextEditingController storeName;
  final TextEditingController whatsApp;
  final TextEditingController address;
  final VoidCallback onLogoPressed;

  @override
  Widget build(BuildContext context) {
    return _SettingsCard(
      title: 'Store Profile',
      icon: LucideIcons.store,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: InkWell(
              key: const ValueKey('store-logo-upload'),
              onTap: onLogoPressed,
              borderRadius: BorderRadius.circular(999),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 88,
                    height: 88,
                    decoration: const BoxDecoration(
                      color: AppColors.blushRose,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      LucideIcons.flower2,
                      size: 38,
                      color: AppColors.deepRose,
                    ),
                  ),
                  Positioned(
                    right: -2,
                    bottom: -2,
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: const BoxDecoration(
                        color: AppColors.deepRose,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        LucideIcons.camera,
                        size: 16,
                        color: AppColors.pureWhite,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 22),
          const _FieldLabel('Nama Toko'),
          const SizedBox(height: 7),
          TextFormField(controller: storeName, validator: _required),
          const SizedBox(height: 16),
          const _FieldLabel('Nomor WhatsApp Admin'),
          const SizedBox(height: 7),
          TextFormField(
            controller: whatsApp,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              prefixIcon: Icon(LucideIcons.messageCircle, size: 18),
            ),
            validator: _required,
          ),
          const SizedBox(height: 16),
          const _FieldLabel('Alamat Fisik Toko'),
          const SizedBox(height: 7),
          TextFormField(
            controller: address,
            minLines: 3,
            maxLines: 5,
            validator: _required,
          ),
        ],
      ),
    );
  }

  static String? _required(String? value) =>
      value == null || value.trim().isEmpty ? 'Field wajib diisi' : null;
}

class _DeliverySettingsCard extends StatelessWidget {
  const _DeliverySettingsCard({
    required this.baseFee,
    required this.perKmFee,
    required this.radius,
    required this.onRadiusChanged,
  });

  final TextEditingController baseFee;
  final TextEditingController perKmFee;
  final double radius;
  final ValueChanged<double> onRadiusChanged;

  @override
  Widget build(BuildContext context) {
    return _SettingsCard(
      title: 'Delivery Settings',
      icon: LucideIcons.truck,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _FieldLabel('Base Delivery Fee'),
          const SizedBox(height: 7),
          TextFormField(
            controller: baseFee,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(prefixText: 'Rp '),
            validator: _positiveNumber,
          ),
          const SizedBox(height: 16),
          const _FieldLabel('Biaya Tambahan per KM'),
          const SizedBox(height: 7),
          TextFormField(
            controller: perKmFee,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(prefixText: 'Rp '),
            validator: _positiveNumber,
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              const Expanded(child: _FieldLabel('Radius Pengiriman Maksimal')),
              Text(
                '${radius.round()} KM',
                style: Theme.of(context).textTheme.labelLarge,
              ),
            ],
          ),
          Slider(
            value: radius,
            min: 0,
            max: 25,
            divisions: 25,
            activeColor: AppColors.primaryPink,
            label: '${radius.round()} KM',
            onChanged: onRadiusChanged,
          ),
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [Text('0 KM'), Text('25 KM')],
          ),
        ],
      ),
    );
  }

  static String? _positiveNumber(String? value) {
    final number = int.tryParse(value?.trim() ?? '');
    return number == null || number < 0 ? 'Nominal tidak valid' : null;
  }
}

class _TransactionLogicCard extends StatelessWidget {
  const _TransactionLogicCard({
    required this.minimumDp,
    required this.paymentDeadline,
    required this.taxEnabled,
    required this.onDeadlineChanged,
    required this.onTaxChanged,
  });

  final TextEditingController minimumDp;
  final int paymentDeadline;
  final bool taxEnabled;
  final ValueChanged<int> onDeadlineChanged;
  final ValueChanged<bool> onTaxChanged;

  @override
  Widget build(BuildContext context) {
    return _SettingsCard(
      title: 'Transaction Logic',
      icon: LucideIcons.receiptText,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _FieldLabel('Persentase DP Minimal'),
          const SizedBox(height: 7),
          TextFormField(
            controller: minimumDp,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(suffixText: '%'),
            validator: (value) {
              final number = int.tryParse(value?.trim() ?? '');
              return number == null || number < 0 || number > 100
                  ? 'Persentase harus 0–100'
                  : null;
            },
          ),
          const SizedBox(height: 16),
          const _FieldLabel('Batas Waktu Bayar DP'),
          const SizedBox(height: 7),
          DropdownButtonFormField<int>(
            initialValue: paymentDeadline,
            items: const [
              DropdownMenuItem(value: 12, child: Text('12 jam')),
              DropdownMenuItem(value: 24, child: Text('24 jam')),
              DropdownMenuItem(value: 48, child: Text('48 jam')),
            ],
            onChanged: (value) {
              if (value != null) {
                onDeadlineChanged(value);
              }
            },
          ),
          const SizedBox(height: 18),
          Material(
            color: AppColors.offWhite,
            borderRadius: BorderRadius.circular(14),
            child: SwitchListTile(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              title: const Text('Aktifkan PPN 11%'),
              subtitle: Text(taxEnabled ? 'PPN aktif' : 'PPN nonaktif'),
              value: taxEnabled,
              activeTrackColor: AppColors.primaryPink,
              onChanged: onTaxChanged,
            ),
          ),
        ],
      ),
    );
  }
}

class _NeedHelpCard extends StatelessWidget {
  const _NeedHelpCard({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.blushRose, AppColors.offWhite],
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.softPink),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.lifeBuoy, size: 28, color: AppColors.deepRose),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Need Help?',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 3),
                Text(
                  'Tim support siap membantu konfigurasi toko.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: onPressed,
            child: const Text('Hubungi Support'),
          ),
        ],
      ),
    );
  }
}

class _SettingsCard extends StatelessWidget {
  const _SettingsCard({
    required this.title,
    required this.icon,
    required this.child,
  });

  final String title;
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.pureWhite,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _settingsBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: AppColors.deepRose),
              const SizedBox(width: 9),
              Text(title, style: Theme.of(context).textTheme.titleMedium),
            ],
          ),
          const SizedBox(height: 22),
          child,
        ],
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(label, style: Theme.of(context).textTheme.labelLarge);
  }
}
