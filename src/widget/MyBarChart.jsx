import { Bar } from '@ant-design/charts';

const ROW_HEIGHT = 32; // 每行大概的视觉高度

const MyBarChart = ({ data, barConfig, key }) => {
  if (data == null || data.length == 0) {
    return <></>
  }
  const barHeight = Math.max(data.length, 1) * ROW_HEIGHT;
  const config = {
    ...barConfig,
    data: data,
    autoFit: true,
    height: barHeight + 100,
    key: key,
  };
  return <Bar {...config} />;
};

export default MyBarChart;
