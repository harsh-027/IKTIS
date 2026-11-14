import { useRive } from '@rive-app/react-canvas';

export default function RiveAnimation({ src, artboard, stateMachines, className = '', ...props }) {
  if (!src) {
    throw new Error('RiveAnimation requires a .riv asset URL supplied by the product team.');
  }

  const { RiveComponent } = useRive({
    src,
    artboard,
    stateMachines,
    autoplay: false,
    ...props,
  });

  return <RiveComponent className={className} />;
}
