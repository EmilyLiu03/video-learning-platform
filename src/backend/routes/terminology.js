const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// 术语库数据文件路径
const terminologyFilePath = path.join(__dirname, '../data/terminology.json');

// 读取术语库数据
function readTerminology() {
    try {
        if (fs.existsSync(terminologyFilePath)) {
            const data = fs.readFileSync(terminologyFilePath, 'utf8');
            const jsonData = JSON.parse(data);
            return jsonData.terms || [];
        }
        return [];
    } catch (error) {
        console.error('读取术语库数据失败:', error);
        return [];
    }
}

// 获取所有术语
router.get('/list', (req, res) => {
    try {
        const terms = readTerminology();
        
        res.json({
            success: true,
            terms: terms,
            total: terms.length
        });
        
    } catch (error) {
        console.error('获取术语列表失败:', error);
        res.json({
            success: false,
            error: '获取术语列表失败: ' + error.message
        });
    }
});

// 搜索术语
router.get('/search', (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim() === '') {
            return res.json({
                success: false,
                error: '搜索关键词不能为空'
            });
        }
        
        const terms = readTerminology();
        const searchTerm = q.toLowerCase().trim();
        
        // 搜索中文、英文术语和定义
        const filteredTerms = terms.filter(term => {
            return term.chinese.toLowerCase().includes(searchTerm) ||
                   term.english.toLowerCase().includes(searchTerm) ||
                   term.chineseDefinition.toLowerCase().includes(searchTerm) ||
                   term.englishDefinition.toLowerCase().includes(searchTerm);
        });
        
        res.json({
            success: true,
            terms: filteredTerms,
            total: filteredTerms.length,
            query: q
        });
        
    } catch (error) {
        console.error('搜索术语失败:', error);
        res.json({
            success: false,
            error: '搜索术语失败: ' + error.message
        });
    }
});

// 获取单个术语详情
router.get('/:id', (req, res) => {
    try {
        const termId = parseInt(req.params.id);
        const terms = readTerminology();
        
        const term = terms.find(t => t.id === termId);
        
        if (term) {
            res.json({
                success: true,
                term: term
            });
        } else {
            res.json({
                success: false,
                error: '术语不存在'
            });
        }
        
    } catch (error) {
        console.error('获取术语详情失败:', error);
        res.json({
            success: false,
            error: '获取术语详情失败: ' + error.message
        });
    }
});

module.exports = router;