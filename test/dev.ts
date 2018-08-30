import path from 'path';
import { MockServer } from '../src/index';

const mockServer = new MockServer({
  mockHome: path.resolve(__dirname, '../mock_home')
});

mockServer.listen(3000);