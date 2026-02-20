/**
 * 출고 탭 컴포넌트 (입고와 동일한 구조, 색상만 다름)
 */
import InboundTab from './InboundTab';

const OutboundTab = (props) => {
  return <InboundTab {...props} mode="outbound" />;
};

export default OutboundTab;
