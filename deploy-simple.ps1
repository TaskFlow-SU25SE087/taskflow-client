# Script deploy đơn giản lên Azure
# Chạy với quyền Administrator

Write-Host "=== Deploy TaskFlow lên Azure ===" -ForegroundColor Green

# Kiểm tra Azure CLI
try {
    az version
    Write-Host "Azure CLI đã sẵn sàng" -ForegroundColor Green
} catch {
    Write-Host "Azure CLI chưa được cài đặt. Vui lòng cài đặt trước." -ForegroundColor Red
    exit 1
}

# Đăng nhập Azure
Write-Host "`n=== Đăng nhập Azure ===" -ForegroundColor Yellow
az login

# Tạo Resource Group
Write-Host "`n=== Tạo Resource Group ===" -ForegroundColor Yellow
az group create --name taskflow-rg --location "Southeast Asia"

# Tạo App Service Plan
Write-Host "`n=== Tạo App Service Plan ===" -ForegroundColor Yellow
az appservice plan create --name taskflow-plan --resource-group taskflow-rg --sku B1 --is-linux

# Tạo Web App
Write-Host "`n=== Tạo Web App ===" -ForegroundColor Yellow
az webapp create --resource-group taskflow-rg --plan taskflow-plan --name taskflow-client --runtime "NODE|18-lts"

# Cấu hình Environment Variables
Write-Host "`n=== Cấu hình Environment Variables ===" -ForegroundColor Yellow
az webapp config appsettings set --resource-group taskflow-rg --name taskflow-client --settings `
    VITE_API_BASE_URL="https://your-api-domain.com" `
    VITE_SIGNALR_HUB_URL="https://your-api-domain.com/taskHub" `
    VITE_GITHUB_CLIENT_ID="your_github_client_id" `
    VITE_GITHUB_REDIRECT_URI="https://taskflow-client.azurewebsites.net/github/callback"

# Hiển thị thông tin
Write-Host "`n=== Hoàn thành! ===" -ForegroundColor Green
Write-Host "Web App URL: https://taskflow-client.azurewebsites.net" -ForegroundColor Cyan

# Mở web app
Start-Process "https://taskflow-client.azurewebsites.net"

Write-Host "`n=== Bước tiếp theo ===" -ForegroundColor Green
Write-Host "1. Push code lên GitHub" -ForegroundColor White
Write-Host "2. Kết nối GitHub với Azure" -ForegroundColor White
Write-Host "3. Cập nhật environment variables" -ForegroundColor White 