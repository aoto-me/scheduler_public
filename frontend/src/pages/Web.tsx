import { SectionTitle } from '@/components/ui';
import { ErrorList, RssList, WebList } from '@/components/Web';
import { useFetchCsv, useFetchRss, useFetchSettings } from '@/hooks';
import { selectSortedRssItems, selectWebState, setRssItemsFetched, useAppDispatch, useAppSelector } from '@/redux';
import type { RSSList } from '@/types';
import { Grid } from '@mui/material';
import { useEffect, useState } from 'react';

const Web = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { emptyRssList, errorWebCsv, fetched, rssList, updated, webCsv } = useAppSelector(selectWebState);
  const { fetchWebCsv } = useFetchCsv();
  const { fetchRssItem } = useFetchRss();
  const { fetchRssList } = useFetchSettings();
  const rssItems = useAppSelector(selectSortedRssItems);
  const dispatch = useAppDispatch();

  // データの取得 - RSS
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchRss = async () => {
      let _rssList: null | RSSList[] = [];

      // rssListがなければ取得
      _rssList = !rssList || rssList.length === 0 ? await fetchRssList() : [...rssList];

      // rssListが0件なら終了
      if (!_rssList || _rssList.length === 0) return;

      // 全件取得済み かつ 変更なし なら以降の処理をスキップ
      if (fetched && !updated) return;

      for (const listItem of _rssList) {
        if (signal.aborted) return; //途中中断
        await fetchRssItem(listItem, signal);
      }

      if (!signal.aborted) {
        dispatch(setRssItemsFetched(true)); // 全件取得完了フラグ
      }
    };

    fetchRss()
      .catch(() => {
        if (!signal.aborted) {
          console.error('Webページ：RSSの取得に失敗しました');
        }
      })
      .finally(() => {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort(); // ページ遷移時に中断
    };
  }, []);

  // データの取得 - CSVのWeb更新データ
  useEffect(() => {
    if (webCsv) return;
    void fetchWebCsv();
  }, []);

  return (
    <Grid columnSpacing={{ lg: 5, md: 4, xs: 0 }} container rowSpacing={6}>
      <Grid size={{ md: 6, xs: 12 }}>
        <SectionTitle title="新着記事" />
        <RssList isLoading={isLoading} rssItems={rssItems} />
      </Grid>
      <Grid size={{ md: 6, xs: 12 }}>
        <SectionTitle title="サイト更新（RSSなし）" />
        <WebList webCsv={webCsv} />
      </Grid>
      {(errorWebCsv.length > 0 || emptyRssList.length > 0) && (
        <Grid size={{ xs: 12 }}>
          <SectionTitle title="データ取得エラー" />
          <ErrorList emptyRssList={emptyRssList} errorWebCsv={errorWebCsv} />
        </Grid>
      )}
    </Grid>
  );
};

export default Web;
