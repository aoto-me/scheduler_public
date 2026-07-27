import { API_ENDPOINTS } from '@/configs';
import { setGalleryCardContent, setGalleryImgContent, setGalleryType, useAppDispatch } from '@/redux';
import type {
  CardThumbnail as CardThumbnailType,
  GalleryCard,
  GalleryTypeWithNull,
  ImageItem,
  ResponseGalleryItem,
} from '@/types';
import { splitFileName } from '@/utils';
import { useHttpRequest } from '../useHttpRequest';

export const useFetchGallery = () => {
  const { getRequest } = useHttpRequest();
  const dispatch = useAppDispatch();

  /**
   * ギャラリーのタイプ（diary / gallery）を取得
   */
  const fetchGalleryType = async (postId: string): Promise<GalleryTypeWithNull | null> => {
    const response = await getRequest<GalleryTypeWithNull>({
      apiUrl: `${API_ENDPOINTS.gallery}type/${postId}/`,
      queryParams: {},
    });

    if (!response) return null;

    dispatch(setGalleryType({ id: Number(postId), type: response }));

    return response;
  };

  /**
   * ギャラリーのカード一覧を取得
   */
  const fetchGalleryCards = async (
    postId: string
  ): Promise<null | { card: GalleryCard[]; thumb: CardThumbnailType[] }> => {
    const response = await getRequest<{ card: GalleryCard[]; thumb: CardThumbnailType[] }>({
      apiUrl: `${API_ENDPOINTS.gallery}card/${postId}/`,
      queryParams: {},
    });

    if (!response) return null;

    const sortedCards = [...response.card].sort((a, b) => a.sort - b.sort);
    dispatch(setGalleryCardContent({ cards: sortedCards, galleryId: Number(postId), thumbs: response.thumb }));

    return { card: sortedCards, thumb: response.thumb };
  };

  /**
   * ギャラリーの画像・動画アイテム一覧を取得
   */
  const fetchGalleryItems = async (postId: string, uploadUrl: string): Promise<ImageItem[] | null> => {
    const response = await getRequest<ResponseGalleryItem[]>({
      apiUrl: `${API_ENDPOINTS.gallery}img/${postId}/`,
      queryParams: {},
    });

    if (!response) return null;

    const sorted = [...response].sort((a, b) => a.sort - b.sort);
    const items: ImageItem[] = sorted.map(item => {
      const { extension, name } = splitFileName(item.file);
      return {
        cardId: item.cardId,
        extension,
        id: item.id,
        name,
        sort: item.sort,
        url: `${uploadUrl}${item.file}`,
      };
    });
    dispatch(setGalleryImgContent({ galleryId: Number(postId), items }));

    return items;
  };

  /**
   * カードの詳細データを取得（日記・ギャラリー共用）
   */
  const fetchCardItem = async (
    cardId: number,
    isDiary: boolean
  ): Promise<null | { content: string; item: ResponseGalleryItem[] }> => {
    const response = await getRequest<{ content: string; item: ResponseGalleryItem[] }>({
      apiUrl: isDiary
        ? `${API_ENDPOINTS.diary}item/${String(cardId)}/`
        : `${API_ENDPOINTS.gallery}cardItem/${String(cardId)}/`,
      queryParams: {},
    });

    return response;
  };

  return { fetchCardItem, fetchGalleryCards, fetchGalleryItems, fetchGalleryType };
};
