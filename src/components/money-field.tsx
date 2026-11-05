import type { TextInputProps } from 'react-native';

import { TextField } from '@/components/form';
import { maskMoney } from '@/lib/format';

type Props = Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType'> & {
  value: string;
  onChangeText: (value: string) => void;
};

// Money input that adds the thousands dots while typing (10000 -> 10.000).
export function MoneyField({ value, onChangeText, ...rest }: Props) {
  return (
    <TextField
      keyboardType="decimal-pad"
      {...rest}
      value={value}
      onChangeText={(text) => onChangeText(maskMoney(text))}
    />
  );
}
