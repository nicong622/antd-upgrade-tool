import React, { useState, useEffect } from 'react';
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Input, Cascader } from 'antd';
import { getMovieList } from '@/services/movie';
import { activityList } from '@/services/wlactivity';
import { getList } from '@/services/maimi';
import { getGoodsList } from '@/services/zcstore';
import { getWxappActList } from '@/services/wxappActivity';
import { fetchVideoList } from '@/services/video';
import { cascadeOptions as originOptions, wxAppId } from './config';

function fixCascaderInitialValue(value, optionList) {
  if (!value) return;

  let result = value;
  const temp = `-${value[0]}-`;
  const filtered = optionList.filter((item) => {
    if (typeof item.value === 'string') {
      return item.value.indexOf(temp) >= 0;
    }
    return `-${item.value}-` === temp;
  })[0];

  if (filtered) {
    if (typeof filtered.value === 'number') {
      // filtered.value 是数字的时候，value[0] 就等于 filtered.value，所以要把 value[0] 去掉
      value.shift();
    }
    result = [filtered.value].concat(value);
  }

  return result;
}

// 热门电影
function fetchMovieList(setOptionFn, options) {
  return getMovieList({ offset: 0, limit: 30 })
    .then((res) => {
      if (res.code === 0) {
        options[1].children = res.data.map((movie) => ({
          value: movie.movieId,
          label: movie.movieName,
        }));

        setOptionFn(options);
      }
    })
    .catch(console.error);
}

// 热门活动
function getActivityList(setOptionFn, options) {
  // 2, 3, 1, 4 分别对应 观影招募 大牌福利 品牌活动 影院活动
  const promiseList = [2, 3, 1, 4].map((type) => activityList({ type, offset: 0, limit: 30 }));
  Promise.all(promiseList)
    .then((dataList) => {
      if (!dataList) return;

      options[2].children = options[2].children.map((child, index) => ({
        ...child,
        children: dataList[index].data
          ? dataList[index].data.map((item) => ({
              value: item.id,
              label: item.title,
            }))
          : [],
      }));

      setOptionFn(options);
    })
    .catch(console.error);
}

// 麦迷社区
function getMaimiInfoList(setOptionFn, options) {
  getList({ offset: 0, limit: 30 })
    .then((res) => {
      if (res && res.code === 0) {
        options[3].children[1].children = res.data.map((item) => ({
          value: item.id,
          label: item.title,
        }));
        setOptionFn(options);
      }
    })
    .catch(console.error);
}

// 积分商城
function fetchGoodsList(setOptionFn, options) {
  const promiseList = [1, 2, 3].map((type) =>
    getGoodsList({ cid: type, offset: 0, limit: 30 })
      .then((res) => {
        if (res && res.code === 0) return res;
        return { data: [] };
      })
      .catch(console.error)
  );
  Promise.all(promiseList)
    .then((dataList) => {
      options[4].children = options[4].children.map((child, index) => ({
        ...child,
        children: dataList[index].data.map((item) => ({
          value: item.id,
          label: item.name,
        })),
      }));
      setOptionFn(options);
    })
    .catch(console.error);
}

// 小程序合作活动列表
function fetchWxappActList(setOptionFn, options) {
  getWxappActList(0, 20)
    .then((res) => {
      if (res.code === 0) {
        options[6].children = res.data.map((item) => ({
          value: item.id,
          label: item.name,
        }));

        setOptionFn(options);
      }
    })
    .catch((err) => console.error('fetchWxappActList', err));
}

// 视频列表
function fetchVideoDetailList(setOptionFn, options) {
  fetchVideoList({ offset: 0, limit: 20 })
    .then((res) => {
      if (res.code === 0) {
        options[7].children[1].children = res.data.map((item) => ({
          value: item.id,
          label: item.videoTitle,
        }));

        setOptionFn(options);
      }
    })
    .catch((err) => console.error('fetchVideoList', err));
}

export default function LinkType(props) {
  const { getFieldDecorator, initialType, shouldShowCooperation, jumperUrl } = props;

  // 判断是否需要展示【小程序合作活动】选项
  const options = shouldShowCooperation
    ? originOptions
    : originOptions.filter((item) => item.value !== 81);

  const [cascadeOptions, setCascadeOptions] = useState(options);
  const [showLinkInput, toggleLinkInputShow] = useState(initialType[0] === 999); // 自定义路径
  const [showPathInput, togglePathInputShow] = useState(!!wxAppId[`${initialType[0]}`]); // 第三方小程序路径

  useEffect(() => {
    fetchMovieList(setCascadeOptions, cascadeOptions);
    getActivityList(setCascadeOptions, cascadeOptions);
    getMaimiInfoList(setCascadeOptions, cascadeOptions);
    fetchGoodsList(setCascadeOptions, cascadeOptions);
    fetchVideoDetailList(setCascadeOptions, cascadeOptions);

    if (shouldShowCooperation) {
      fetchWxappActList(setCascadeOptions, cascadeOptions);
    }
  }, []);

  useEffect(() => {
    toggleLinkInputShow(initialType[0] === 999);
    togglePathInputShow(!!wxAppId[`${initialType[0]}`]);
  }, [initialType[0]]);

  const onSelectLinkType = (key) => {
    toggleLinkInputShow(key[0] === 999);
    togglePathInputShow(typeof key[0] === 'string' && key[0].indexOf('wxapp') === 0);
  };

  return (
    <>
      <Form.Item label='跳转页类型'>
        {getFieldDecorator('linkType', {
          rules: [{ required: true }],
          initialValue: fixCascaderInitialValue(initialType, cascadeOptions),
        })(
          <Cascader
            options={cascadeOptions}
            onChange={onSelectLinkType}
            placeholder='Please select'
          />
        )}
      </Form.Item>

      {showLinkInput && (
        <Form.Item label='跳转页地址'>
          {getFieldDecorator('link', {
            initialValue: jumperUrl,
          })(<Input />)}
        </Form.Item>
      )}

      {showPathInput && (
        <Form.Item label='小程序页面地址'>
          {getFieldDecorator('wxAppPath', {
            initialValue: (jumperUrl || '').split('@')[1] || '',
          })(<Input />)}
        </Form.Item>
      )}
    </>
  );
}
