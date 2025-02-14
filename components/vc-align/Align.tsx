import {
  defineComponent,
  PropType,
  ref,
  computed,
  onMounted,
  onUpdated,
  watch,
  onUnmounted,
} from 'vue';
import { alignElement, alignPoint } from 'dom-align';
import addEventListener from '../vc-util/Dom/addEventListener';
import { cloneElement } from '../_util/vnode';
import isVisible from '../vc-util/Dom/isVisible';

import { isSamePoint, restoreFocus, monitorResize } from './util';
import { AlignType, AlignResult, TargetType, TargetPoint } from './interface';
import useBuffer from './hooks/useBuffer';

type OnAlign = (source: HTMLElement, result: AlignResult) => void;

export interface AlignProps {
  align: AlignType;
  target: TargetType;
  onAlign?: OnAlign;
  monitorBufferTime?: number;
  monitorWindowResize?: boolean;
  disabled?: boolean;
}

const alignProps = {
  align: Object as PropType<AlignType>,
  target: [Object, Function] as PropType<TargetType>,
  onAlign: Function as PropType<OnAlign>,
  monitorBufferTime: Number,
  monitorWindowResize: Boolean,
  disabled: Boolean,
};

interface MonitorRef {
  element?: HTMLElement;
  cancel: () => void;
}

export interface RefAlign {
  forceAlign: () => void;
}

function getElement(func: TargetType) {
  if (typeof func !== 'function') return null;
  return func();
}

function getPoint(point: TargetType) {
  if (typeof point !== 'object' || !point) return null;
  return point;
}

export default defineComponent({
  name: 'Align',
  props: alignProps,
  emits: ['align'],
  setup(props, { expose, slots }) {
    const cacheRef = ref<{ element?: HTMLElement; point?: TargetPoint }>({});
    const nodeRef = ref();
    const forceAlignPropsRef = computed(() => ({
      disabled: props.disabled,
      target: props.target,
      onAlign: props.onAlign,
    }));

    const [forceAlign, cancelForceAlign] = useBuffer(
      () => {
        const {
          disabled: latestDisabled,
          target: latestTarget,
          onAlign: latestOnAlign,
        } = forceAlignPropsRef.value;
        if (!latestDisabled && latestTarget && nodeRef.value && nodeRef.value.$el) {
          const source = nodeRef.value.$el;

          let result: AlignResult;
          const element = getElement(latestTarget);
          const point = getPoint(latestTarget);

          cacheRef.value.element = element;
          cacheRef.value.point = point;

          // IE lose focus after element realign
          // We should record activeElement and restore later
          const { activeElement } = document;

          // We only align when element is visible
          if (element && isVisible(element)) {
            result = alignElement(source, element, props.align);
          } else if (point) {
            result = alignPoint(source, point, props.align);
          }

          restoreFocus(activeElement, source);

          if (latestOnAlign && result) {
            latestOnAlign(source, result);
          }

          return true;
        }

        return false;
      },
      computed(() => props.monitorBufferTime),
    );

    // ===================== Effect =====================
    // Listen for target updated
    const resizeMonitor = ref<MonitorRef>({
      cancel: () => {},
    });
    // Listen for source updated
    const sourceResizeMonitor = ref<MonitorRef>({
      cancel: () => {},
    });

    const goAlign = () => {
      const target = props.target;
      const element = getElement(target);
      const point = getPoint(target);

      if (nodeRef.value && nodeRef.value.$el !== sourceResizeMonitor.value.element) {
        sourceResizeMonitor.value.cancel();
        sourceResizeMonitor.value.element = nodeRef.value.$el;
        sourceResizeMonitor.value.cancel = monitorResize(nodeRef.value.$el, forceAlign);
      }

      if (cacheRef.value.element !== element || !isSamePoint(cacheRef.value.point, point)) {
        forceAlign();

        // Add resize observer
        if (resizeMonitor.value.element !== element) {
          resizeMonitor.value.cancel();
          resizeMonitor.value.element = element;
          resizeMonitor.value.cancel = monitorResize(element, forceAlign);
        }
      }
    };

    onMounted(() => {
      goAlign();
    });

    onUpdated(() => {
      goAlign();
    });

    // Listen for disabled change
    watch(
      () => props.disabled,
      disabled => {
        if (!disabled) {
          forceAlign();
        } else {
          cancelForceAlign();
        }
      },
      { flush: 'post' },
    );

    // Listen for window resize
    const winResizeRef = ref<{ remove: Function }>(null);

    watch(
      () => props.monitorWindowResize,
      monitorWindowResize => {
        if (monitorWindowResize) {
          if (!winResizeRef.value) {
            winResizeRef.value = addEventListener(window, 'resize', forceAlign);
          }
        } else if (winResizeRef.value) {
          winResizeRef.value.remove();
          winResizeRef.value = null;
        }
      },
      { flush: 'post' },
    );
    onUnmounted(() => {
      resizeMonitor.value.cancel();
      sourceResizeMonitor.value.cancel();
      if (winResizeRef.value) winResizeRef.value.remove();
      cancelForceAlign();
    });

    expose({
      forceAlign: () => forceAlign(true),
    });

    return () => {
      const child = slots?.default();
      if (child) {
        return cloneElement(child[0], { ref: nodeRef });
      }
      return child && child[0];
    };
  },
});
