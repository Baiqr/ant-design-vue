import { App, Plugin } from 'vue';
import Skeleton from './Skeleton';
import SkeletonButton from './Button';
import SkeletonInput from './Input';
import SkeletonImage from './Image';
import SkeletonAvatar from './Avatar';

export { SkeletonProps, skeletonProps } from './Skeleton';

Skeleton.Button = SkeletonButton;
Skeleton.Avatar = SkeletonAvatar;
Skeleton.Input = SkeletonInput;
Skeleton.Image = SkeletonImage;

/* istanbul ignore next */
Skeleton.install = function(app: App) {
  app.component(Skeleton.name, Skeleton);
  app.component(Skeleton.Button.name, SkeletonButton);
  app.component(Skeleton.Avatar.name, SkeletonAvatar);
  app.component(Skeleton.Input.name, SkeletonInput);
  app.component(Skeleton.Image.name, SkeletonImage);
  return app;
};

export default Skeleton as typeof Skeleton &
  Plugin & {
    readonly Button: typeof SkeletonButton;
    readonly Avatar: typeof SkeletonAvatar;
    readonly Input: typeof SkeletonInput;
    readonly Image: typeof SkeletonImage;
  };
