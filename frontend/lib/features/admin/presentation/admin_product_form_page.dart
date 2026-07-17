import 'package:flutter/material.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:florist_frontend/features/home/domain/product_preview.dart';
import 'package:lucide_flutter/lucide_flutter.dart';

class AdminProductFormPage extends StatefulWidget {
  const AdminProductFormPage({this.product, super.key});

  final ProductPreview? product;

  @override
  State<AdminProductFormPage> createState() => _AdminProductFormPageState();
}

class _AdminProductFormPageState extends State<AdminProductFormPage> {
  static const _categories = [
    'Bunga Bouquet',
    'Bloom Box',
    'Bunga Meja',
    'Papan Ucapan',
    'Gift & Hampers',
  ];

  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _priceController;
  late final TextEditingController _descriptionController;
  late String _category;
  late String _stockStatus;
  var _visibleInStore = true;

  bool get _isEditing => widget.product != null;

  @override
  void initState() {
    super.initState();
    final product = widget.product;
    _nameController = TextEditingController(text: product?.name ?? '');
    _priceController = TextEditingController(
      text: product == null ? '' : product.price.toString(),
    );
    _descriptionController = TextEditingController();
    _category = product?.category ?? _categories.first;
    if (!_categories.contains(_category)) {
      _category = _categories.first;
    }
    _stockStatus = product?.stockStatus == ProductStockStatus.preOrder
        ? 'Pre-Order'
        : 'Ready';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _priceController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.sizeOf(context).width < 600;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FC),
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Produk' : 'Tambah Produk Baru'),
        leading: IconButton(
          tooltip: 'Kembali',
          onPressed: () => Navigator.pop(context),
          icon: const Icon(LucideIcons.arrowLeft),
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          isMobile ? 12 : 28,
          isMobile ? 16 : 28,
          isMobile ? 12 : 28,
          40,
        ),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 820),
            child: Container(
              padding: EdgeInsets.all(isMobile ? 16 : 26),
              decoration: BoxDecoration(
                color: AppColors.pureWhite,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFECEEF2)),
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      _isEditing ? 'Informasi Produk' : 'Produk Baru',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Lengkapi data katalog dan pengaturan tampil produk.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 24),
                    _FormLabel(text: 'Nama Produk'),
                    const SizedBox(height: 8),
                    TextFormField(
                      key: const ValueKey('admin-product-name'),
                      controller: _nameController,
                      decoration: const InputDecoration(
                        hintText: 'Contoh: Sweet Romance Bouquet',
                      ),
                      validator: (value) =>
                          value == null || value.trim().isEmpty
                          ? 'Nama produk wajib diisi'
                          : null,
                    ),
                    const SizedBox(height: 18),
                    if (isMobile)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _CategoryField(
                            value: _category,
                            items: _categories,
                            onChanged: (value) =>
                                setState(() => _category = value),
                          ),
                          const SizedBox(height: 18),
                          _PriceField(controller: _priceController),
                        ],
                      )
                    else
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: _CategoryField(
                              value: _category,
                              items: _categories,
                              onChanged: (value) =>
                                  setState(() => _category = value),
                            ),
                          ),
                          const SizedBox(width: 18),
                          Expanded(
                            child: _PriceField(controller: _priceController),
                          ),
                        ],
                      ),
                    const SizedBox(height: 18),
                    _FormLabel(text: 'Stok'),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      key: const ValueKey('admin-product-stock'),
                      initialValue: _stockStatus,
                      items: const [
                        DropdownMenuItem(value: 'Ready', child: Text('Ready')),
                        DropdownMenuItem(
                          value: 'Pre-Order',
                          child: Text('Pre-Order (PO)'),
                        ),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          setState(() => _stockStatus = value);
                        }
                      },
                    ),
                    const SizedBox(height: 18),
                    _FormLabel(text: 'Deskripsi'),
                    const SizedBox(height: 8),
                    TextFormField(
                      key: const ValueKey('admin-product-description'),
                      controller: _descriptionController,
                      minLines: 4,
                      maxLines: 7,
                      decoration: const InputDecoration(
                        hintText:
                            'Tuliskan detail produk, ukuran, dan isi paket...',
                        alignLabelWithHint: true,
                      ),
                    ),
                    const SizedBox(height: 22),
                    _PhotoUploadArea(onPressed: _simulateUpload),
                    const SizedBox(height: 20),
                    Material(
                      color: AppColors.offWhite,
                      borderRadius: BorderRadius.circular(14),
                      child: SwitchListTile(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 4,
                        ),
                        title: const Text('Tampilkan di Toko'),
                        subtitle: Text(
                          _visibleInStore ? 'Aktif' : 'Sembunyikan',
                        ),
                        value: _visibleInStore,
                        activeTrackColor: AppColors.primaryPink,
                        onChanged: (value) {
                          setState(() => _visibleInStore = value);
                        },
                      ),
                    ),
                    const SizedBox(height: 26),
                    if (isMobile)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          FilledButton(
                            key: const ValueKey('save-admin-product'),
                            onPressed: _save,
                            child: const Text('Simpan Produk'),
                          ),
                          const SizedBox(height: 10),
                          OutlinedButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Batal'),
                          ),
                        ],
                      )
                    else
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          OutlinedButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Batal'),
                          ),
                          const SizedBox(width: 12),
                          FilledButton(
                            key: const ValueKey('save-admin-product'),
                            onPressed: _save,
                            child: const Text('Simpan Produk'),
                          ),
                        ],
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

  void _simulateUpload() {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        const SnackBar(
          content: Text('Simulasi pemilih foto produk dibuka.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
  }

  void _save() {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
            _isEditing
                ? 'Perubahan produk disimpan.'
                : 'Produk baru berhasil disimpan.',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
  }
}

class _FormLabel extends StatelessWidget {
  const _FormLabel({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(text, style: Theme.of(context).textTheme.labelLarge);
  }
}

class _CategoryField extends StatelessWidget {
  const _CategoryField({
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final String value;
  final List<String> items;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _FormLabel(text: 'Kategori'),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          key: const ValueKey('admin-product-category'),
          initialValue: value,
          items: items
              .map(
                (category) =>
                    DropdownMenuItem(value: category, child: Text(category)),
              )
              .toList(),
          onChanged: (newValue) {
            if (newValue != null) {
              onChanged(newValue);
            }
          },
        ),
      ],
    );
  }
}

class _PriceField extends StatelessWidget {
  const _PriceField({required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _FormLabel(text: 'Harga (IDR)'),
        const SizedBox(height: 8),
        TextFormField(
          key: const ValueKey('admin-product-price'),
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(prefixText: 'Rp ', hintText: '0'),
          validator: (value) {
            final price = int.tryParse(value?.trim() ?? '');
            return price == null || price <= 0 ? 'Harga tidak valid' : null;
          },
        ),
      ],
    );
  }
}

class _PhotoUploadArea extends StatelessWidget {
  const _PhotoUploadArea({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _DashedBorderPainter(),
      child: InkWell(
        key: const ValueKey('admin-product-photo-upload'),
        onTap: onPressed,
        borderRadius: BorderRadius.circular(16),
        child: const SizedBox(
          height: 158,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(LucideIcons.camera, size: 34, color: AppColors.primaryPink),
              SizedBox(height: 10),
              Text('Unggah Foto Produk'),
              SizedBox(height: 4),
              Text(
                'PNG atau JPG, maksimal 5 MB',
                style: TextStyle(fontSize: 12, color: AppColors.mediumGray),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DashedBorderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..addRRect(
        RRect.fromRectAndRadius(Offset.zero & size, const Radius.circular(16)),
      );
    final paint = Paint()
      ..color = AppColors.softPink
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        canvas.drawPath(metric.extractPath(distance, distance + 8), paint);
        distance += 14;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
