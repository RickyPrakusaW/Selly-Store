String formatRupiah(int amount) {
  final digits = amount.toString();
  final result = StringBuffer('Rp ');

  for (var index = 0; index < digits.length; index++) {
    if (index > 0 && (digits.length - index) % 3 == 0) {
      result.write('.');
    }
    result.write(digits[index]);
  }

  return result.toString();
}
