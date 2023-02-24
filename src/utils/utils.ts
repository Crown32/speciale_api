export class Utils {
  static formatNumber(number: string) {
    // número = +5599999999999
    const cleaned = ('' + number).replace(/\D/g, '');
    // número = 5599999999999
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{4}|\d{5})(\d{4})$/);
    // número = 55 99 99999 9999
    if (match) {
      return ['(', match[2], ')', match[3], '-', match[4]].join('')
    }
    // número = (99) 99999-9999
    return '';
  }
}