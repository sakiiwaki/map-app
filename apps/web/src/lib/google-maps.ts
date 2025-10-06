// lib/google-maps.ts
export const loadGoogleMapsApi = (): Promise<typeof google> => {
  // すでにロード済みなら、それを返す
  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    return Promise.resolve(window.google);
  }

  // まだロードされていない場合は新しく読み込む
  return new Promise((resolve, reject) => {
    // すでに script タグがあるなら再利用
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google));
      return;
    }

    // 新しい script タグを作る
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    // 読み込み成功時
    script.onload = () => resolve(window.google);
    // 読み込み失敗時
    script.onerror = (err) => reject(err);

    // head に追加
    document.head.appendChild(script);
  });
};
