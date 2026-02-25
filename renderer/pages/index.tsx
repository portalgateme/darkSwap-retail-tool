import { MainContent } from '../components/MainContent'
import { Layout } from '../components/Layout'
import { AutoOrderContent } from '../components/AutoOrderContent'

export default function Home() {
  return (
    <Layout title='Auto Orders'>
      <AutoOrderContent />
    </Layout>
  )
}
