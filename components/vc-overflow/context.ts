import {
  computed,
  ComputedRef,
  defineComponent,
  inject,
  InjectionKey,
  PropType,
  provide,
} from 'vue';
import { Key } from '../_util/type';

export interface OverflowContextProviderValueType {
  prefixCls: string;
  responsive: boolean;
  order: number;
  registerSize: (key: Key, width: number | null) => void;
  display: boolean;

  invalidate: boolean;

  // Item Usage
  item?: any;
  itemKey?: Key;

  // Rest Usage
  className?: string;
}

const OverflowContextProviderKey: InjectionKey<ComputedRef<OverflowContextProviderValueType | null>> = Symbol(
  'OverflowContextProviderKey',
);

export const OverflowContextProvider = defineComponent({
  name: 'OverflowContextProvider',
  inheritAttrs: false,
  props: {
    value: { type: Object as PropType<OverflowContextProviderValueType> },
  },
  setup(props, { slots }) {
    provide(
      OverflowContextProviderKey,
      computed(() => props.value),
    );
    return () => slots.default?.();
  },
});

export const useInjectOverflowContext = (): ComputedRef<OverflowContextProviderValueType | null> => {
  return inject(
    OverflowContextProviderKey,
    computed(() => null),
  );
};
