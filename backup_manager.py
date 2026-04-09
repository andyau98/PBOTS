#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Git 備份管理工具 - Backup Manager
一個專業的 Git 備份管理工具，支援手動備份、還原和備份紀錄查看
"""

import argparse
import subprocess
import sys
import os
from datetime import datetime
import re

def check_git_initialized():
    """檢查當前資料夾是否已初始化 Git"""
    if not os.path.exists('.git'):
        print("❌ 錯誤：當前資料夾未初始化 Git")
        print("💡 請先執行以下命令初始化 Git：")
        print("   git init")
        print("   git config user.name \"您的姓名\"")
        print("   git config user.email \"您的郵箱\"")
        return False
    return True

def execute_git_command(command):
    """執行 Git 命令並返回結果"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def has_uncommitted_changes():
    """檢查是否有未提交的改動"""
    success, stdout, stderr = execute_git_command("git status --porcelain")
    if success and stdout.strip():
        return True
    return False

def backup_save():
    """執行備份保存功能"""
    if not check_git_initialized():
        return False
    
    # 檢查是否有改動
    if not has_uncommitted_changes():
        print("ℹ️  沒有檢測到任何改動，無需備份")
        return True
    
    # 生成備份訊息
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    commit_message = f"Manual Backup: {timestamp}"
    
    print(f"💾 開始執行備份...")
    
    # 執行 Git 命令
    commands = [
        "git add .",
        f'git commit -m "{commit_message}"'
    ]
    
    for cmd in commands:
        success, stdout, stderr = execute_git_command(cmd)
        if not success:
            print(f"❌ 執行命令失敗: {cmd}")
            if stderr:
                print(f"   錯誤訊息: {stderr}")
            return False
    
    print("✅ 備份完成！")
    print(f"📝 備份訊息: {commit_message}")
    return True

def backup_list():
    """顯示最近 10 次備份紀錄"""
    if not check_git_initialized():
        return False
    
    print("📋 最近 10 次備份紀錄：")
    print("-" * 80)
    
    # 獲取 Git 紀錄
    success, stdout, stderr = execute_git_command(
        "git log --oneline --pretty=format:'%h|%ad|%s' --date=format:'%Y-%m-%d %H:%M:%S' -10"
    )
    
    if not success:
        print("❌ 無法獲取 Git 紀錄")
        if stderr:
            print(f"   錯誤訊息: {stderr}")
        return False
    
    if not stdout.strip():
        print("ℹ️  暫無備份紀錄")
        return True
    
    # 解析並顯示紀錄
    commits = []
    for line in stdout.strip().split('\n'):
        parts = line.split('|', 2)
        if len(parts) == 3:
            commits.append({
                'commit_id': parts[0],
                'date_time': parts[1],
                'message': parts[2]
            })
    
    # 顯示表格格式的紀錄
    print(f"{'Commit ID':<10} {'日期':<19} {'時間':<8} {'備份訊息'}")
    print("-" * 80)
    
    for commit in commits:
        date_parts = commit['date_time'].split(' ')
        date = date_parts[0]
        time = date_parts[1] if len(date_parts) > 1 else ""
        
        # 截斷過長的訊息
        message = commit['message']
        if len(message) > 40:
            message = message[:37] + "..."
        
        print(f"{commit['commit_id']:<10} {date:<10} {time:<8} {message}")
    
    print("-" * 80)
    print(f"📊 總共顯示 {len(commits)} 筆備份紀錄")
    return True

def backup_return(commit_id):
    """還原到指定的 Commit"""
    if not check_git_initialized():
        return False
    
    # 檢查是否有未提交的改動
    if has_uncommitted_changes():
        print("⚠️  警告：檢測到未提交的改動！")
        print("💡 建議先執行備份保存，否則未提交的改動將會遺失")
        print("   您可以執行: backup -save")
        
        confirm = input("❓ 確定要繼續嗎？(y/N): ").strip().lower()
        if confirm != 'y':
            print("🔚 操作已取消")
            return False
    
    # 驗證 Commit ID 格式
    if not re.match(r'^[a-f0-9]{7,}$', commit_id):
        print("❌ 錯誤：無效的 Commit ID 格式")
        print("💡 Commit ID 應該是 7 個字符以上的十六進制數字")
        return False
    
    print(f"🔄 開始還原到 Commit: {commit_id}")
    
    # 執行還原
    success, stdout, stderr = execute_git_command(f"git reset --hard {commit_id}")
    
    if not success:
        print("❌ 還原失敗")
        if stderr:
            print(f"   錯誤訊息: {stderr}")
        
        # 檢查是否 Commit ID 不存在
        if "bad revision" in stderr.lower():
            print("💡 請使用 backup -list 查看可用的 Commit ID")
        return False
    
    print("✅ 還原成功！")
    print(f"📝 系統已還原到 Commit: {commit_id}")
    return True

def show_help():
    """顯示幫助訊息"""
    help_text = """
🤖 Git 備份管理工具 - 使用說明書

📋 可用指令：

backup -save
    💾 執行備份保存
    • 自動執行 git add . 和 git commit
    • 備份訊息格式: "Manual Backup: [YYYY-MM-DD HH:mm:ss]"

backup -list
    📋 顯示備份紀錄
    • 顯示最近 10 次備份紀錄
    • 包含 Commit ID、日期、時間和備份訊息

backup -restore [CommitID]
    🔄 還原到指定備份點
    • 使用 git reset --hard 進行還原
    • 如果檢測到未提交改動會提示確認
    • 範例: backup -restore a1b2c3d

backup -help
    📖 顯示此幫助訊息

💡 使用提示：
• 首次使用請確保已執行 git init
• 建議定期執行備份保存重要改動
• 還原前請確認已保存重要資料

🔧 技術資訊：
• 使用 Python 3 開發
• 基於 Git 版本控制系統
• 支援跨平台運行 (Mac/Windows/Linux)
"""
    print(help_text)

def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="Git 備份管理工具",
        add_help=False
    )
    
    # 定義指令參數
    parser.add_argument('-save', action='store_true', help='執行備份保存')
    parser.add_argument('-list', action='store_true', help='顯示備份紀錄')
    parser.add_argument('-restore', metavar='COMMIT_ID', help='還原到指定備份點')
    parser.add_argument('-help', action='store_true', help='顯示幫助訊息')
    
    # 解析參數
    args = parser.parse_args()
    
    # 處理指令
    if args.save:
        backup_save()
    elif args.list:
        backup_list()
    elif args.restore:
        backup_return(args.restore)
    elif args.help:
        show_help()
    else:
        # 如果沒有指定任何參數，顯示幫助
        show_help()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 程式已被用戶中斷")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 程式執行錯誤: {e}")
        sys.exit(1)