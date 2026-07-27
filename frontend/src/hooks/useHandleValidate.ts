import { useErrorContext } from '@/contexts';
import {
  validateDate,
  validateNonBlank,
  validateNonNegativeNumber,
  validatePositiveInteger,
  validateText,
} from '@/utils';

export const useHandleValidate = () => {
  const { setErrors } = useErrorContext();

  // 0より大きい整数値かどうか
  const handleValidatePositiveInteger = (value: unknown, key: string) => {
    if (validatePositiveInteger(value)) return true;
    const errorMessage = `【${key}】整数値である必要があります。`;
    setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));
    return false;
  };

  // 空白でないか、指定の文字数以内か
  const handleValidateText = (value: string, key: string, maxLength?: number) => {
    if (validateNonBlank(value) && validateText(value, maxLength)) return true;

    const errorMessage = validateNonBlank(value)
      ? `【${key}】${String(maxLength)}文字以内で入力してください。`
      : `【${key}】内容を入力してください。`;

    setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));

    return false;
  };

  // Dateかどうか
  const handleValidateDate = (value: unknown, key: string) => {
    if (validateDate(value)) return true;
    const errorMessage = `【${key}】日付が正しく設定されていません。`;
    setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));
    return false;
  };

  // null or undefined じゃないか
  const handleValidateNonNull = (value: unknown, key: string) => {
    if (value !== null && value !== undefined) return true;
    const errorMessage = `【${key}】値が正しく設定されていません。`;
    setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));
    return false;
  };

  // マイナス値でないか
  const handleValidateNonNegativeNumber = (value: unknown, key: string) => {
    if (validateNonNegativeNumber(value)) return true;
    const errorMessage = `【${key}】0以上の数値である必要があります。`;
    setErrors(prev => (prev.includes(errorMessage) ? prev : [...prev, errorMessage]));
    return false;
  };

  // nullでない場合にマイナス値でないか
  const handleValidateNullableNonNegativeNumber = (value: unknown, key: string): boolean => {
    if (value === null || value === undefined) return true;
    return handleValidateNonNegativeNumber(value, key);
  };

  return {
    handleValidateDate,
    handleValidateNonNegativeNumber,
    handleValidateNonNull,
    handleValidateNullableNonNegativeNumber,
    handleValidatePositiveInteger,
    handleValidateText,
  };
};
