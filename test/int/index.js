const testsContext = require.context('./specs', true, /\.spec$/)
testsContext.keys().forEach(testsContext)

// just test src/script
const srcContext = require.context('../../src/script', true, /\.js$/)
srcContext.keys().forEach(srcContext)
