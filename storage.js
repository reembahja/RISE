const Store = {
  p: 'rise_',
  get(k, d) { try { const v = localStorage.getItem(this.p + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(this.p + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(this.p + k); } catch (e) {} }
};
