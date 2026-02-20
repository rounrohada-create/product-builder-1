/**
 * 조회 탭 컴포넌트
 */
import { useState } from 'react';
import { Card, Input, Button, List, Empty, Tag } from 'antd';
import { SearchOutlined, BarcodeOutlined } from '@ant-design/icons';
import './SearchTab.css';

const SearchTab = ({ inventoryData, onUploadExcel, onDownloadTemplate }) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = () => {
    if (!searchText.trim()) return;
    
    const results = inventoryData.filter(item => 
      item.itemCode.includes(searchText) || 
      item.itemName.includes(searchText) ||
      item.barcode === searchText
    );
    setSearchResults(results);
  };

  return (
    <div className="search-tab">
      <Card className="search-card">
        <Input.Search
          size="large"
          placeholder="품번, 상품명, 바코드로 검색"
          enterButton={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={handleSearch}
          prefix={<BarcodeOutlined />}
        />
      </Card>

      {searchResults.length > 0 ? (
        <List
          dataSource={searchResults}
          renderItem={(item) => (
            <Card className="search-result-item" hoverable>
              <div className="result-header">
                <h4>{item.itemName}</h4>
                <Tag color="blue">{item.itemCode}</Tag>
              </div>
              <div className="result-details">
                <p>현재고: {item.currentStock}개</p>
                <p>안전재고: {item.safetyStock}개</p>
                {item.sizes.length > 0 && (
                  <p>사이즈: {item.sizes.join(', ')}</p>
                )}
              </div>
            </Card>
          )}
        />
      ) : searchText && (
        <Empty description="검색 결과가 없습니다" />
      )}
    </div>
  );
};

export default SearchTab;
