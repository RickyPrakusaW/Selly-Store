import 'package:flutter/material.dart';
import 'package:florist_frontend/core/theme.dart';
import 'package:florist_frontend/features/cart/presentation/cart_page.dart';
import 'package:florist_frontend/features/checkout/presentation/checkout_page.dart';
import 'package:florist_frontend/features/home/presentation/home_page.dart';

void main() {
  runApp(const FloristApp());
}

class FloristApp extends StatelessWidget {
  const FloristApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Seli Florist',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      initialRoute: '/',
      routes: {
        '/': (_) => const HomePage(),
        '/cart': (_) => const CartPage(),
        '/checkout': (_) => const CheckoutPage(),
      },
    );
  }
}
