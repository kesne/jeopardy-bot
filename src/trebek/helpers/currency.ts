export default function currency(value: number) {
    return (value || 0).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
    });
}
