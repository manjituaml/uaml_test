


export const createDomesticAmount = async(req, res)=>{
    try {
        const {orderType, quantity, unitPrice, currency = "INR"} = req.body;
        
        if(orderType === "Export") return res.status(300).json({success: false, message: "Order is not domestic"})
        
    } catch (error) {
        
    }
}

export const createExportAmount = async(req, res)=>{
    try {
        const {orderType, quantity, unitPrice, currency = "USD", exchangeRate} = req.body;
        
        if(orderType === "Domestic") return res.status(300).json({success: false, message: "Order is not export"})
    
        } catch (error) {
        
    }
}