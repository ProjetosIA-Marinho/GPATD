import React, { useEffect, useState } from 'react';
import { getSignedUrl } from '../../lib/storage';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & { stored?: string | null };

/**
 * <img> que resolve uma URL assinada e temporária do Storage a partir da URL
 * salva (`stored`). Enquanto resolve, não exibe imagem quebrada.
 * Use no lugar de <img src={urlPublica} /> para buckets privados.
 */
export default function SignedImage({ stored, ...rest }: Props) {
  const [src, setSrc] = useState<string>('');
  useEffect(() => {
    let active = true;
    getSignedUrl(stored).then((url) => {
      if (active) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, [stored]);
  if (!src) return null;
  return <img src={src} {...rest} />;
}
